package com.facilitymanager.service;

import com.facilitymanager.dto.ChiTietKiemKeDto;
import com.facilitymanager.dto.DotKiemKeDto;
import com.facilitymanager.entity.TaiSan;
import com.facilitymanager.entity.DotKiemKe;
import com.facilitymanager.entity.ChiTietKiemKe;
import com.facilitymanager.entity.Phong;
import com.facilitymanager.repository.TaiSanRepository;
import com.facilitymanager.repository.ChiTietKiemKeRepository;
import com.facilitymanager.repository.DotKiemKeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DichVuKiemKe {

    private final DotKiemKeRepository auditRepository;
    private final ChiTietKiemKeRepository auditDetailRepository;
    private final TaiSanRepository assetRepository;
    public DichVuKiemKe(
            DotKiemKeRepository auditRepository,
            ChiTietKiemKeRepository auditDetailRepository,
            TaiSanRepository assetRepository
    ) {
        this.auditRepository = auditRepository;
        this.auditDetailRepository = auditDetailRepository;
        this.assetRepository = assetRepository;
    }

    @Transactional(readOnly = true)
    public List<DotKiemKeDto> danhSach() {
        return auditRepository.findAllByOrderByStartedAtDesc().stream()
                .map(DotKiemKeDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DotKiemKeDto chiTiet(long id) {
        DotKiemKe audit = timAudit(id);
        DotKiemKeDto dto = DotKiemKeDto.fromEntity(audit);
        dto.setDetails(chiTietEntities(id).stream().map(ChiTietKiemKeDto::fromEntity).toList());
        return dto;
    }

    @Transactional
    public DotKiemKeDto tao(Map<String, Object> body, Long userId) {
        String name = chuoi(body, "name");
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đợt kiểm kê không được để trống.");
        }
        String scopeType = chuoi(body, "scopeType", "scope_type");
        if (scopeType == null || scopeType.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phạm vi (scopeType) là bắt buộc.");
        }
        scopeType = scopeType.trim().toUpperCase(Locale.ROOT);
        if (!"BUILDING".equals(scopeType) && !"ROOM".equals(scopeType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "scopeType phải là BUILDING hoặc ROOM.");
        }
        String scopeValue = chuoi(body, "scopeValue", "scope_value", "buildingCode", "roomCode");
        if (scopeValue == null || scopeValue.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá trị phạm vi không được để trống.");
        }
        scopeValue = scopeValue.trim();

        List<TaiSan> assets = layTaiSanTheoPhamVi(scopeType, scopeValue, body);
        if (assets.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không có tài sản nào trong phạm vi đã chọn.");
        }

        DotKiemKe audit = new DotKiemKe();
        audit.setName(name.trim());
        audit.setScopeType(scopeType);
        audit.setScopeValue(scopeValue);
        audit.setStatus("IN_PROGRESS");
        audit.setCreatedBy(userId);
        audit = auditRepository.save(audit);

        for (TaiSan asset : assets) {
            auditDetailRepository.save(taoChiTietTuTaiSan(audit, asset));
        }

        return chiTiet(audit.getId());
    }

    @Transactional
    public DotKiemKeDto capNhatChiTiet(long auditId, List<Map<String, Object>> rows) {
        DotKiemKe audit = timAudit(auditId);
        chanNeuHoanTat(audit);
        if (rows == null || rows.isEmpty()) {
            return chiTiet(auditId);
        }
        Map<Long, ChiTietKiemKe> byId = chiTietEntities(auditId).stream()
                .collect(Collectors.toMap(ChiTietKiemKe::getId, d -> d));
        for (Map<String, Object> row : rows) {
            Long detailId = soLong(row, "id");
            if (detailId == null) {
                continue;
            }
            ChiTietKiemKe detail = byId.get(detailId);
            if (detail == null) {
                continue;
            }
            if (row.containsKey("actualQty") || row.containsKey("actual_qty")) {
                detail.setActualQty(soInt(row, "actualQty", "actual_qty"));
            }
            if (row.containsKey("actualRoom") || row.containsKey("actual_room")) {
                detail.setActualRoom(chuoi(row, "actualRoom", "actual_room"));
            }
            if (row.containsKey("actualStatus") || row.containsKey("actual_status")) {
                detail.setActualStatus(chuoi(row, "actualStatus", "actual_status"));
            }
            if (row.containsKey("note")) {
                detail.setNote(chuoi(row, "note"));
            }
            apDungDoiChieu(detail);
            auditDetailRepository.save(detail);
        }
        return chiTiet(auditId);
    }

    @Transactional
    public DotKiemKeDto hoanTat(long auditId) {
        DotKiemKe audit = timAudit(auditId);
        if ("COMPLETED".equals(audit.getStatus())) {
            return chiTiet(auditId);
        }
        audit.setStatus("COMPLETED");
        audit.setCompletedAt(LocalDateTime.now());
        auditRepository.save(audit);
        return chiTiet(auditId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> xuatJson(long auditId) {
        DotKiemKeDto audit = chiTiet(auditId);
        List<Map<String, Object>> items = new ArrayList<>();
        List<Map<String, Object>> discrepanciesOnly = new ArrayList<>();
        int matchedCount = 0;
        for (ChiTietKiemKeDto d : audit.getDetails()) {
            Map<String, Object> item = itemExport(d);
            items.add(item);
            if (Boolean.TRUE.equals(d.getMatched())) {
                matchedCount++;
            } else {
                discrepanciesOnly.add(item);
            }
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalAssets", items.size());
        summary.put("matchedCount", matchedCount);
        summary.put("discrepancyCount", items.size() - matchedCount);

        Map<String, Object> auditHeader = new LinkedHashMap<>();
        auditHeader.put("id", audit.getId());
        auditHeader.put("name", audit.getName());
        auditHeader.put("scopeType", audit.getScopeType());
        auditHeader.put("scopeValue", audit.getScopeValue());
        auditHeader.put("status", audit.getStatus());
        auditHeader.put("completedAt", audit.getCompletedAt());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("audit", auditHeader);
        out.put("summary", summary);
        out.put("items", items);
        out.put("discrepanciesOnly", discrepanciesOnly);
        return out;
    }

    private static Map<String, Object> itemExport(ChiTietKiemKeDto d) {
        Map<String, Object> system = new LinkedHashMap<>();
        system.put("quantity", d.getSystemQty());
        system.put("room", d.getSystemRoom());
        system.put("status", d.getSystemStatus());
        Map<String, Object> actual = new LinkedHashMap<>();
        actual.put("quantity", d.getActualQty());
        actual.put("room", d.getActualRoom());
        actual.put("status", d.getActualStatus());
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("assetId", d.getAssetId());
        item.put("cardNumber", d.getCardNumber());
        item.put("assetName", d.getAssetName());
        item.put("system", system);
        item.put("actual", actual);
        item.put("matched", d.getMatched());
        item.put("discrepancyType", d.getDiscrepancyType());
        item.put("note", d.getNote());
        return item;
    }

    private List<TaiSan> layTaiSanTheoPhamVi(String scopeType, String scopeValue, Map<String, Object> body) {
        if ("BUILDING".equals(scopeType)) {
            return assetRepository.findByRoomBuildingCode(scopeValue);
        }
        Long roomId = soLong(body, "roomId", "room_id");
        if (roomId != null) {
            return assetRepository.findByRoomId(roomId);
        }
        return assetRepository.findByRoomCode(scopeValue);
    }

    private ChiTietKiemKe taoChiTietTuTaiSan(DotKiemKe audit, TaiSan asset) {
        ChiTietKiemKe d = new ChiTietKiemKe();
        d.setAudit(audit);
        d.setAssetId(asset.getId());
        d.setCardNumber(asset.getCardNumber());
        d.setAssetName(asset.getAssetName());
        d.setSystemQty(asset.getQuantity() != null ? asset.getQuantity() : 0);
        d.setSystemStatus(asset.getStatus() != null ? asset.getStatus() : "IN_USE");
        Phong room = asset.getRoom();
        if (room != null) {
            d.setSystemRoom(room.getRoomCode());
            d.setRoomFloor(room.getFloor());
            d.setRoomCode(room.getRoomCode());
        } else if (asset.getClassroom() != null && !asset.getClassroom().isBlank()) {
            d.setSystemRoom(asset.getClassroom().trim());
        }
        d.setMatched(true);
        d.setDiscrepancyType(null);
        return d;
    }

    static void apDungDoiChieu(ChiTietKiemKe d) {
        int sysQty = d.getSystemQty() != null ? d.getSystemQty() : 0;
        int actQty = d.getActualQty() != null ? d.getActualQty() : sysQty;
        String sysRoom = chuanHoa(d.getSystemRoom());
        String actRoom = d.getActualRoom() != null && !d.getActualRoom().isBlank()
                ? chuanHoa(d.getActualRoom()) : sysRoom;
        String sysStatus = chuanHoa(d.getSystemStatus());
        String actStatus = d.getActualStatus() != null && !d.getActualStatus().isBlank()
                ? chuanHoa(d.getActualStatus()) : sysStatus;

        if (actQty == sysQty && actRoom.equals(sysRoom) && actStatus.equals(sysStatus)) {
            d.setMatched(true);
            d.setDiscrepancyType(null);
            return;
        }
        d.setMatched(false);
        if (actQty != sysQty) {
            d.setDiscrepancyType(actQty < sysQty ? "THIEU" : "KHAC");
        } else if (!actRoom.equals(sysRoom)) {
            d.setDiscrepancyType("SAI_VI_TRI");
        } else if (!actStatus.equals(sysStatus)) {
            d.setDiscrepancyType("HONG");
        } else {
            d.setDiscrepancyType("KHAC");
        }
    }

    private static String chuanHoa(String s) {
        return s == null ? "" : s.trim().toUpperCase(Locale.ROOT);
    }

    private List<ChiTietKiemKe> chiTietEntities(long auditId) {
        return auditDetailRepository.findByAudit_IdOrderByRoomFloorAscRoomCodeAscCardNumberAsc(auditId);
    }

    private DotKiemKe timAudit(long id) {
        return auditRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đợt kiểm kê."));
    }

    private static void chanNeuHoanTat(DotKiemKe audit) {
        if ("COMPLETED".equals(audit.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đợt kiểm kê đã hoàn tất, không thể chỉnh sửa.");
        }
    }

    private static String chuoi(Map<String, Object> m, String... keys) {
        for (String k : keys) {
            Object v = m.get(k);
            if (v != null) {
                String s = String.valueOf(v).trim();
                if (!s.isEmpty() && !"null".equalsIgnoreCase(s)) {
                    return s;
                }
            }
        }
        return null;
    }

    private static Long soLong(Map<String, Object> m, String... keys) {
        for (String k : keys) {
            Object v = m.get(k);
            if (v == null) continue;
            if (v instanceof Number n) return n.longValue();
            try {
                return Long.parseLong(String.valueOf(v).trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private static Integer soInt(Map<String, Object> m, String... keys) {
        Long l = soLong(m, keys);
        return l != null ? l.intValue() : null;
    }
}
