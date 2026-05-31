package com.facilitymanager.service;

import com.facilitymanager.dto.NguoiPhanViecDto;
import com.facilitymanager.dto.YeuCauDto;
import com.facilitymanager.entity.YeuCau;
import com.facilitymanager.entity.NguoiDung;
import com.facilitymanager.repository.YeuCauRepository;
import com.facilitymanager.repository.NguoiDungRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DichVuYeuCau {

    private static final Set<String> PRIORITIES = Set.of("HIGH", "NORMAL", "LOW");
    private static final Set<String> STATUSES = Set.of("NEW", "IN_PROGRESS", "RESOLVED", "DRAFT", "CLOSED");
    private static final Set<String> MANAGER_GROUPS = Set.of("CSVC", "CNTT", "THIET_BI");

    private final YeuCauRepository repo;
    private final NguoiDungRepository userRepository;

    public DichVuYeuCau(YeuCauRepository repo, NguoiDungRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<NguoiPhanViecDto> danhSachNguoiPhanViec() {
        return userRepository.findAll(Sort.by(Sort.Direction.ASC, "fullName")).stream()
                .map(u -> new NguoiPhanViecDto(u.getId(), u.getFullName(), u.getUsername(), u.getRole()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<YeuCauDto> danhSach(
            String status,
            String managerGroup,
            String priority,
            Boolean isDraft,
            Long createdByUserId,
            Boolean openOnly,
            Long assignedToUserId,
            String assignedToUserFullName,
            String roleCode
    ) {
        if (isStudent(roleCode)) {
            if (createdByUserId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin người dùng.");
            }
        }
        Specification<YeuCau> spec = buildSpec(
                status, managerGroup, priority, isDraft, createdByUserId, openOnly,
                assignedToUserId, assignedToUserFullName);
        return repo.findAll(spec, Sort.by(Sort.Direction.ASC, "id")).stream()
                .map(YeuCauDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public YeuCauDto chiTiet(Long id, Long userId, String roleCode) {
        YeuCau r = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu."));
        if (isStudent(roleCode) && (userId == null || !userId.equals(r.getCreatedByUserId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền xem yêu cầu này.");
        }
        return YeuCauDto.fromEntity(r);
    }

    @Transactional
    public YeuCauDto tao(YeuCauDto dto, boolean draft, Long userId) {
        YeuCau r = new YeuCau();
        applyInput(r, dto, draft, true);
        r.setDraft(draft);
        r.setCreatedByUserId(userId);
        if (draft) {
            r.setStatus("DRAFT");
        } else {
            r.setStatus("NEW");
        }
        return YeuCauDto.fromEntity(repo.save(r));
    }

    @Transactional
    public YeuCauDto capNhat(Long id, YeuCauDto dto, Long userId, String roleCode) {
        YeuCau r = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu."));
        if (isStudent(roleCode)) {
            if (userId == null || !userId.equals(r.getCreatedByUserId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền sửa yêu cầu này.");
            }
            if (!r.isDraft()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ được sửa yêu cầu nháp.");
            }
            applyInput(r, dto, true, false);
            if (dto.getIsDraft() != null) {
                r.setDraft(dto.getIsDraft());
            }
            if (!r.isDraft()) {
                r.setStatus("NEW");
            }
        } else {
            if (dto.getAssignedToUserId() != null) {
                NguoiDung assignee = userRepository.findById(dto.getAssignedToUserId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST, "Người xử lý không tồn tại."));
                r.setAssignedToUserId(assignee.getId());
                r.setManagerName(assignee.getFullName());
            }
            if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
                String st = dto.getStatus().trim().toUpperCase(Locale.ROOT);
                if (!STATUSES.contains(st)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ.");
                }
                r.setStatus(st);
                if ("IN_PROGRESS".equals(st) && r.getAssignedToUserId() == null) {
                    if (dto.getAssignedToUserId() != null) {
                        // đã xử lý ở khối assignedToUserId phía trên
                    } else if (userId != null && isManager(roleCode)) {
                        userRepository.findById(userId).ifPresent(u -> {
                            r.setAssignedToUserId(u.getId());
                            r.setManagerName(u.getFullName());
                        });
                    } else {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST, "Cần phân công người phụ trách trước khi ghi nhận.");
                    }
                }
            }
            if (dto.getNote() != null) {
                r.setNote(dto.getNote().trim());
            }
        }
        return YeuCauDto.fromEntity(repo.save(r));
    }

    @Transactional
    public void xoa(Long id, Long userId, String roleCode) {
        YeuCau r = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu."));
        if (isStudent(roleCode)) {
            if (userId == null || !userId.equals(r.getCreatedByUserId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền xóa yêu cầu này.");
            }
        }
        repo.delete(r);
    }

    @Transactional(readOnly = true)
    public long demMoi() {
        return repo.countByStatusAndDraftFalse("NEW");
    }

    public static String mapPriority(String raw) {
        if (raw == null || raw.isBlank()) {
            return "NORMAL";
        }
        String s = raw.trim();
        if ("Khẩn cấp".equalsIgnoreCase(s) || "URGENT".equalsIgnoreCase(s) || "HIGH".equalsIgnoreCase(s)) {
            return "HIGH";
        }
        if ("Theo dõi".equalsIgnoreCase(s) || "WATCH".equalsIgnoreCase(s) || "LOW".equalsIgnoreCase(s)) {
            return "LOW";
        }
        if ("Bình thường".equalsIgnoreCase(s) || "NORMAL".equalsIgnoreCase(s)) {
            return "NORMAL";
        }
        String up = s.toUpperCase(Locale.ROOT);
        if (PRIORITIES.contains(up)) {
            return up;
        }
        return "NORMAL";
    }

    public static String mapManagerGroup(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String s = raw.trim();
        if ("Thiết bị".equalsIgnoreCase(s) || "THIET BI".equalsIgnoreCase(s)) {
            return "THIET_BI";
        }
        String up = s.toUpperCase(Locale.ROOT);
        if (MANAGER_GROUPS.contains(up)) {
            return up;
        }
        return up;
    }

    private void applyInput(YeuCau r, YeuCauDto dto, boolean draft, boolean allowPartial) {
        if (!draft && (dto.getTitle() == null || dto.getTitle().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiêu đề không được để trống.");
        }
        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            r.setTitle(dto.getTitle().trim());
        } else if (!allowPartial && (r.getTitle() == null || r.getTitle().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiêu đề không được để trống.");
        }
        if (dto.getNote() != null) {
            r.setNote(dto.getNote().trim());
        }
        if (dto.getManagerGroup() != null) {
            r.setManagerGroup(mapManagerGroup(dto.getManagerGroup()));
        }
        if (dto.getPriority() != null) {
            r.setPriority(mapPriority(dto.getPriority()));
        }
        if (dto.getAttachmentUrl() != null) {
            String url = dto.getAttachmentUrl().trim();
            if (url.length() > 255) {
                url = url.substring(0, 255);
            }
            r.setAttachmentUrl(url.isEmpty() ? null : url);
        }
    }

    private static Specification<YeuCau> buildSpec(
            String status,
            String managerGroup,
            String priority,
            Boolean isDraft,
            Long createdByUserId,
            Boolean openOnly,
            Long assignedToUserId,
            String assignedToUserFullName
    ) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (Boolean.TRUE.equals(openOnly)) {
                preds.add(root.get("status").in(List.of("NEW", "IN_PROGRESS")));
            } else if (status != null && !status.isBlank()) {
                preds.add(cb.equal(root.get("status"), status.trim().toUpperCase(Locale.ROOT)));
            }
            if (managerGroup != null && !managerGroup.isBlank()) {
                preds.add(cb.equal(root.get("managerGroup"), mapManagerGroup(managerGroup)));
            }
            if (priority != null && !priority.isBlank()) {
                preds.add(cb.equal(root.get("priority"), mapPriority(priority)));
            }
            if (isDraft != null) {
                preds.add(cb.equal(root.get("draft"), isDraft));
            }
            if (createdByUserId != null) {
                preds.add(cb.equal(root.get("createdByUserId"), createdByUserId));
            }
            if (assignedToUserId != null) {
                Predicate byId = cb.equal(root.get("assignedToUserId"), assignedToUserId);
                if (assignedToUserFullName != null && !assignedToUserFullName.isBlank()) {
                    String normalized = assignedToUserFullName.trim().toLowerCase(Locale.ROOT);
                    Predicate legacyByName = cb.and(
                            cb.isNull(root.get("assignedToUserId")),
                            cb.equal(cb.lower(cb.trim(root.get("managerName"))), normalized));
                    preds.add(cb.or(byId, legacyByName));
                } else {
                    preds.add(byId);
                }
            }
            return cb.and(preds.toArray(Predicate[]::new));
        };
    }

    private static boolean isStudent(String roleCode) {
        return roleCode != null && "STUDENT".equalsIgnoreCase(roleCode);
    }

    private static boolean isManager(String roleCode) {
        return roleCode != null && "MANAGER".equalsIgnoreCase(roleCode);
    }
}
