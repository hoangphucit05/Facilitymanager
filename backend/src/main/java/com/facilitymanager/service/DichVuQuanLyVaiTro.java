package com.facilitymanager.service;

import com.facilitymanager.dto.VaiTroPhanHoiDto;
import com.facilitymanager.dto.YeuCauCapNhatVaiTro;
import com.facilitymanager.dto.YeuCauTaoVaiTro;
import com.facilitymanager.entity.QuyenMenuUngDung;
import com.facilitymanager.entity.VaiTroUngDung;
import com.facilitymanager.repository.QuyenMenuUngDungRepository;
import com.facilitymanager.repository.UserRepository;
import com.facilitymanager.repository.VaiTroUngDungRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DichVuQuanLyVaiTro {

    private static final Set<String> MA_HE_THONG = Set.of("ADMIN", "MANAGER", "STAFF", "STUDENT");

    private final VaiTroUngDungRepository vaiTroUngDungRepository;
    private final QuyenMenuUngDungRepository quyenMenuUngDungRepository;
    private final UserRepository userRepository;

    public DichVuQuanLyVaiTro(
            VaiTroUngDungRepository vaiTroUngDungRepository,
            QuyenMenuUngDungRepository quyenMenuUngDungRepository,
            UserRepository userRepository
    ) {
        this.vaiTroUngDungRepository = vaiTroUngDungRepository;
        this.quyenMenuUngDungRepository = quyenMenuUngDungRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<VaiTroPhanHoiDto> danhSach() {
        return vaiTroUngDungRepository.timTatCaKemMenu().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public VaiTroPhanHoiDto tao(YeuCauTaoVaiTro req) {
        if (req.getCode() == null || req.getCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã vai trò (code) không được để trống.");
        }
        String code = req.getCode().trim().toUpperCase(Locale.ROOT);
        if (!code.matches("[A-Z0-9_]{2,50}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã vai trò chỉ gồm chữ in hoa, số, dấu gạch dưới (2–50 ký tự).");
        }
        if (vaiTroUngDungRepository.existsByCodeIgnoreCase(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã vai trò đã tồn tại.");
        }
        VaiTroUngDung v = new VaiTroUngDung();
        v.setCode(code);
        v.setName(req.getName() != null && !req.getName().isBlank() ? req.getName().trim() : code);
        v.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        v.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 100);
        ganMenu(v, req.getMenuIds());
        if (req.getParentRoleId() != null) {
            VaiTroUngDung cha = vaiTroUngDungRepository.findById(req.getParentRoleId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò cha không tồn tại."));
            v.setParentRole(cha);
        }
        return toDto(vaiTroUngDungRepository.save(v));
    }

    @Transactional
    public VaiTroPhanHoiDto capNhat(Long id, YeuCauCapNhatVaiTro req) {
        VaiTroUngDung v = vaiTroUngDungRepository.timTheoIdKemMenu(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vai trò."));
        if (req.getName() != null && !req.getName().isBlank()) {
            v.setName(req.getName().trim());
        }
        if (req.getDescription() != null) {
            v.setDescription(req.getDescription().trim());
        }
        if (req.getSortOrder() != null) {
            v.setSortOrder(req.getSortOrder());
        }
        if (req.getMenuIds() != null) {
            ganMenu(v, req.getMenuIds());
        }
        if (Boolean.TRUE.equals(req.getUpdateParent())) {
            if (req.getParentRoleId() == null) {
                v.setParentRole(null);
            } else {
                if (req.getParentRoleId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không thể kế thừa chính mình.");
                }
                kiemTraKhongChuTrinh(id, req.getParentRoleId());
                VaiTroUngDung cha = vaiTroUngDungRepository.findById(req.getParentRoleId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò cha không tồn tại."));
                v.setParentRole(cha);
            }
        }
        return toDto(vaiTroUngDungRepository.save(v));
    }

    @Transactional
    public void xoa(Long id) {
        VaiTroUngDung v = vaiTroUngDungRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vai trò."));
        if (MA_HE_THONG.contains(v.getCode().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không được xóa vai trò hệ thống.");
        }
        if (userRepository.countByRoleIgnoreCase(v.getCode()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Còn người dùng gắn vai trò này (cột role).");
        }
        if (vaiTroUngDungRepository.countByParentRole_Id(id) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Còn vai trò con kế thừa từ vai trò này; hãy gỡ kế thừa trước.");
        }
        vaiTroUngDungRepository.delete(v);
    }

    private void kiemTraKhongChuTrinh(Long roleId, Long proposedParentId) {
        Long cur = proposedParentId;
        Set<Long> seen = new HashSet<>();
        while (cur != null && seen.add(cur)) {
            if (cur.equals(roleId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cấu hình kế thừa vai trò tạo chu trình.");
            }
            Optional<VaiTroUngDung> cap = vaiTroUngDungRepository.timTheoIdKemMenu(cur);
            if (cap.isEmpty()) {
                break;
            }
            if (cap.get().getParentRole() == null) {
                break;
            }
            cur = cap.get().getParentRole().getId();
        }
    }

    private void ganMenu(VaiTroUngDung v, List<Long> menuIds) {
        v.getMenus().clear();
        if (menuIds == null || menuIds.isEmpty()) {
            return;
        }
        List<QuyenMenuUngDung> list = quyenMenuUngDungRepository.findAllById(menuIds);
        v.getMenus().addAll(new HashSet<>(list));
    }

    private VaiTroPhanHoiDto toDto(VaiTroUngDung v) {
        VaiTroPhanHoiDto d = new VaiTroPhanHoiDto();
        d.setId(v.getId());
        d.setCode(v.getCode());
        d.setName(v.getName());
        d.setDescription(v.getDescription());
        d.setSortOrder(v.getSortOrder());
        d.setMenuIds(v.getMenus().stream().map(QuyenMenuUngDung::getId).sorted().collect(Collectors.toList()));
        if (v.getParentRole() != null) {
            d.setParentRoleId(v.getParentRole().getId());
            d.setParentRoleCode(v.getParentRole().getCode());
        }
        if (v.getCreatedAt() != null) {
            d.setCreateTime(v.getCreatedAt().toString());
        }
        if (v.getUpdatedAt() != null) {
            d.setUpdateTime(v.getUpdatedAt().toString());
        }
        d.setCreateBy("—");
        d.setUpdateBy("—");
        return d;
    }
}
