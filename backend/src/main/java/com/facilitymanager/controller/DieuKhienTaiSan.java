package com.facilitymanager.controller;

import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.facilitymanager.dto.TaiSanDto;
import com.facilitymanager.entity.TaiSan;
import com.facilitymanager.repository.TaiSanRepository;
import com.facilitymanager.repository.PhongRepository;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class DieuKhienTaiSan {

    private final TaiSanRepository repo;
    private final PhongRepository roomRepo;
    private final JdbcTemplate jdbc;

    public DieuKhienTaiSan(TaiSanRepository repo, PhongRepository roomRepo, JdbcTemplate jdbc) {
        this.repo = repo;
        this.roomRepo = roomRepo;
        this.jdbc = jdbc;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<TaiSanDto> getAll(@RequestParam(required = false) String status) {
        List<TaiSan> list = status != null && !status.isBlank()
                ? repo.findByStatusWithRelations(status)
                : repo.findAllWithRelations();
        return list.stream().map(TaiSanDto::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<TaiSanDto> getById(@PathVariable Long id) {
        return repo.findById(id)
                .map(a -> ResponseEntity.ok(TaiSanDto.fromEntity(a)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TaiSanDto dto) {
        if (dto.getCardNumber() == null || dto.getCardNumber().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("thongDiep", "Số thẻ không được để trống"));
        }
        if (dto.getAssetName() == null || dto.getAssetName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("thongDiep", "Tên tài sản không được để trống"));
        }
        TaiSan asset = new TaiSan();
        dto.applyTo(asset);
        if (dto.getRoomId() != null) {
            roomRepo.findById(dto.getRoomId()).ifPresent(asset::setRoom);
        }
        if (asset.getStatus() == null) asset.setStatus("IN_USE");
        TaiSan saved = repo.save(asset);
        return ResponseEntity.status(HttpStatus.CREATED).body(TaiSanDto.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody TaiSanDto dto) {
        return repo.findById(id).map(asset -> {
            dto.applyTo(asset);
            if (dto.getRoomId() != null) {
                roomRepo.findById(dto.getRoomId()).ifPresent(asset::setRoom);
            }
            return ResponseEntity.ok(TaiSanDto.fromEntity(repo.save(asset)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/transfer")
    @Transactional
    public ResponseEntity<?> transfer(@PathVariable Long id, @RequestBody YeuCauDieuChuyenTaiSan request) {
        if (request == null || request.transferQuantity == null || request.transferQuantity <= 0) {
            return ResponseEntity.badRequest().body(Map.of("thongDiep", "Số lượng điều chuyển phải lớn hơn 0"));
        }
        if (request.targetRoomCode == null || request.targetRoomCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("thongDiep", "Phòng đích không được để trống"));
        }
        TaiSan asset = repo.findById(id).orElse(null);
        if (asset == null) return ResponseEntity.notFound().build();

        Integer currentQty = asset.getQuantity() != null ? asset.getQuantity() : 0;
        if (request.transferQuantity > currentQty) {
            return ResponseEntity.badRequest().body(Map.of("thongDiep", "Số lượng điều chuyển vượt quá số lượng hiện có"));
        }

        var targetRoomOpt = roomRepo.findByRoomCode(request.targetRoomCode.trim());
        if (targetRoomOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("thongDiep", "Không tìm thấy phòng đích"));
        }
        var targetRoom = targetRoomOpt.get();
        String sourceRoomCode = asset.getRoom() != null ? asset.getRoom().getRoomCode() : (asset.getClassroom() != null ? asset.getClassroom() : "");
        if (sourceRoomCode != null && sourceRoomCode.equalsIgnoreCase(targetRoom.getRoomCode())) {
            return ResponseEntity.badRequest().body(Map.of("thongDiep", "Phòng đích phải khác phòng hiện tại"));
        }

        String sourceBuildingCode = asset.getRoom() != null ? asset.getRoom().getBuildingCode() : null;
        TaiSan movedAsset;
        if (request.transferQuantity.equals(currentQty)) {
            asset.setRoom(targetRoom);
            asset.setClassroom(targetRoom.getRoomCode());
            movedAsset = repo.save(asset);
        } else {
            asset.setQuantity(currentQty - request.transferQuantity);
            repo.save(asset);
            movedAsset = saoChepTaiSan(asset, request.transferQuantity, targetRoom);
            movedAsset = repo.save(movedAsset);
        }

        Long giverUserId = findUserIdByFullName(request.giverName);
        Long receiverUserId = findUserIdByFullName(request.receiverName);
        LocalDate transferDate = request.transferDate != null ? request.transferDate : LocalDate.now();
        jdbc.update(
                "INSERT INTO asset_transfers (asset_id, source_building, source_classroom, giver_user_id, receiver_user_id, target_building, target_classroom, received_date, note) VALUES (?,?,?,?,?,?,?,?,?)",
                movedAsset.getId(),
                sourceBuildingCode,
                sourceRoomCode,
                giverUserId,
                receiverUserId,
                targetRoom.getBuildingCode(),
                targetRoom.getRoomCode(),
                transferDate,
                request.note
        );

        return ResponseEntity.ok(Map.of(
                "thongDiep", "Điều chuyển thành công",
                "assetId", movedAsset.getId()
        ));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        jdbc.update("DELETE FROM asset_ratings WHERE asset_id = ?", id);
        jdbc.update("DELETE FROM asset_transfers WHERE asset_id = ?", id);
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Long findUserIdByFullName(String fullName) {
        if (fullName == null || fullName.isBlank()) return null;
        List<Long> ids = jdbc.query(
                "SELECT id FROM users WHERE full_name = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"),
                fullName.trim()
        );
        return ids.isEmpty() ? null : ids.get(0);
    }

    private TaiSan saoChepTaiSan(TaiSan source, Integer quantity, com.facilitymanager.entity.Phong targetRoom) {
        TaiSan copy = new TaiSan();
        copy.setCardNumber(taoSoTheDieuChuyen(source.getCardNumber()));
        copy.setAssetName(source.getAssetName());
        copy.setProvider(source.getProvider());
        copy.setCountry(source.getCountry());
        copy.setDepartment(source.getDepartment());
        copy.setClassroom(targetRoom.getRoomCode());
        copy.setAssetType(source.getAssetType());
        copy.setItemCategory(source.getItemCategory());
        copy.setManufactureYear(source.getManufactureYear());
        copy.setUnitPrice(source.getUnitPrice());
        copy.setQuantity(quantity);
        copy.setOriginalPrice(source.getOriginalPrice());
        copy.setFundSource(source.getFundSource());
        copy.setUsageTime(source.getUsageTime());
        copy.setPurchaseDate(source.getPurchaseDate());
        copy.setUsageYear(source.getUsageYear());
        copy.setStatus(source.getStatus());
        copy.setNote(source.getNote());
        copy.setRoom(targetRoom);
        return copy;
    }

    private String taoSoTheDieuChuyen(String cardNumber) {
        String base = (cardNumber == null || cardNumber.isBlank()) ? "TS" : cardNumber.trim();
        String suffix = "-DC" + System.currentTimeMillis();
        String out = base + suffix;
        if (out.length() <= 50) return out;
        int maxBaseLen = Math.max(1, 50 - suffix.length());
        return base.substring(0, Math.min(base.length(), maxBaseLen)) + suffix;
    }

    public static class YeuCauDieuChuyenTaiSan {
        public String targetRoomCode;
        public Integer transferQuantity;
        public LocalDate transferDate;
        public String giverName;
        public String receiverName;
        public String note;
    }
}
