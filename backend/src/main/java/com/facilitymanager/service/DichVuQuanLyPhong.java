package com.facilitymanager.service;

import com.facilitymanager.dto.PhongPhanHoiDto;
import com.facilitymanager.dto.TongHopLoaiTaiSanDto;
import com.facilitymanager.dto.TongHopTaiSanPhongDto;
import com.facilitymanager.dto.TkbTomTatPhongDto;
import com.facilitymanager.entity.Phong;
import com.facilitymanager.repository.TaiSanRepository;
import com.facilitymanager.repository.PhongRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class DichVuQuanLyPhong {

    private final PhongRepository roomRepository;
    private final TaiSanRepository assetRepository;
    private final DichVuLichPhong dichVuLichPhong;

    public DichVuQuanLyPhong(PhongRepository roomRepository, TaiSanRepository assetRepository, DichVuLichPhong dichVuLichPhong) {
        this.roomRepository = roomRepository;
        this.assetRepository = assetRepository;
        this.dichVuLichPhong = dichVuLichPhong;
    }

    @Transactional(readOnly = true)
    public List<PhongPhanHoiDto> layDanhSach(String buildingCode) {
        return layDanhSach(buildingCode, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<PhongPhanHoiDto> layDanhSach(
            String buildingCode,
            Integer week,
            String semester,
            LocalDate date,
            String shift
    ) {
        List<Phong> list;
        if (buildingCode != null && !buildingCode.isBlank()) {
            list = roomRepository.findByBuildingCodeOrderByFloorAscRoomCodeAsc(buildingCode.trim());
        } else {
            list = roomRepository.findAll();
        }
        List<PhongPhanHoiDto> dtos = list.stream().map(this::chuyenSangDto).toList();
        boolean coBoLocLich = date != null || (week != null && week > 0) || (shift != null && !shift.isBlank());
        if (!coBoLocLich) {
            return dtos;
        }
        List<String> roomCodes = list.stream().map(Phong::getRoomCode).toList();
        Map<String, TkbTomTatPhongDto> summary = date != null
                ? dichVuLichPhong.layTomTatTheoPhongVaNgay(roomCodes, date, semester, shift)
                : dichVuLichPhong.layTomTatTheoPhongVaTuan(
                roomCodes,
                week != null && week > 0 ? week : DichVuLichPhong.tinhTuanHienTai(LocalDate.now()),
                semester,
                shift
        );
        return dtos.stream()
                .map((dto) -> apDungSlot(dto, summary.get(dto.roomCode().toLowerCase(Locale.ROOT))))
                .toList();
    }

    @Transactional(readOnly = true)
    public PhongPhanHoiDto layTheoId(long id) {
        return layTheoId(id, null, null, null);
    }

    @Transactional(readOnly = true)
    public PhongPhanHoiDto layTheoId(long id, LocalDate date, String semester, String shift) {
        Phong room = timTheoId(id);
        PhongPhanHoiDto dto = chuyenSangDto(room);
        boolean coBoLocLich = date != null || (shift != null && !shift.isBlank());
        if (!coBoLocLich) {
            return dto;
        }
        LocalDate ngay = date != null ? date : LocalDate.now();
        Map<String, TkbTomTatPhongDto> summary = dichVuLichPhong.layTomTatTheoPhongVaNgay(
                List.of(room.getRoomCode()),
                ngay,
                semester,
                shift
        );
        return apDungSlot(dto, summary.get(room.getRoomCode().toLowerCase(Locale.ROOT)));
    }

    @Transactional(readOnly = true)
    public TongHopTaiSanPhongDto layTongHopTaiSanTheoPhong(long roomId) {
        Phong room = timTheoId(roomId);
        List<TongHopLoaiTaiSanDto> breakdown = assetRepository.tongHopSoLuongTheoDanhMuc(roomId).stream()
                .map((r) -> new TongHopLoaiTaiSanDto(
                        (r.getCategory() == null || r.getCategory().isBlank()) ? "UNCATEGORIZED" : r.getCategory().trim(),
                        r.getQuantity() == null ? 0L : r.getQuantity()
                ))
                .toList();

        long desks = uuTienPhongHoacTaiSan(tongTheoDanhMuc(breakdown, "BAN_HOC"), room.getDeskCount());
        long chairs = uuTienPhongHoacTaiSan(tongTheoDanhMuc(breakdown, "GHE_HOC"), room.getChairCount());
        long speakers = uuTienPhongHoacTaiSan(tongTheoDanhMuc(breakdown, "LOA_AM_TRAN"), room.getSpeakerCount());
        long airConditioners = uuTienPhongHoacTaiSan(tongTheoDanhMuc(breakdown, "MAY_LANH"), room.getAirConditionerCount());
        long microphones = uuTienPhongHoacTaiSan(tongTheoDanhMuc(breakdown, "MICROPHONE"), room.getMicrophoneCount());
        long total = breakdown.stream().mapToLong(TongHopLoaiTaiSanDto::quantity).sum();
        if (total == 0) {
            total = desks + chairs + speakers + airConditioners + microphones;
        }

        return new TongHopTaiSanPhongDto(
                room.getId(),
                room.getRoomCode(),
                total,
                desks,
                chairs,
                speakers,
                airConditioners,
                microphones,
                breakdown
        );
    }

    @Transactional
    public PhongPhanHoiDto tao(Map<String, Object> body) {
        String roomCode = chuoi(body, "roomCode", "room_code");
        if (roomCode == null || roomCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã phòng không được để trống.");
        }
        roomCode = roomCode.trim();
        if (roomRepository.existsByRoomCode(roomCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã phòng đã tồn tại.");
        }
        Phong room = new Phong();
        room.setRoomCode(roomCode);
        apDungTuMap(room, body, true);
        return chuyenSangDto(roomRepository.save(room));
    }

    @Transactional
    public PhongPhanHoiDto capNhat(long id, Map<String, Object> body) {
        Phong room = timTheoId(id);
        String roomCode = chuoi(body, "roomCode", "room_code");
        if (roomCode != null && !roomCode.isBlank()) {
            roomCode = roomCode.trim();
            if (!roomCode.equals(room.getRoomCode()) && roomRepository.existsByRoomCodeAndIdNot(roomCode, id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã phòng đã tồn tại.");
            }
            room.setRoomCode(roomCode);
        }
        apDungTuMap(room, body, false);
        return chuyenSangDto(roomRepository.save(room));
    }

    @Transactional
    public PhongPhanHoiDto capNhatMotPhan(long id, Map<String, Object> patch) {
        return capNhat(id, patch);
    }

    @Transactional
    public void xoa(long id) {
        if (!roomRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phòng.");
        }
        roomRepository.deleteById(id);
    }

    private void apDungTuMap(Phong room, Map<String, Object> body, boolean batBuoc) {
        String building = chuoi(body, "buildingCode", "building_code");
        if (building != null && !building.isBlank()) {
            room.setBuildingCode(building.trim());
        } else if (batBuoc) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã tòa nhà không được để trống.");
        }

        Integer floor = soNguyen(body, "floor");
        if (floor != null) {
            room.setFloor(floor);
        } else if (batBuoc) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tầng không hợp lệ.");
        }

        Integer capacity = soNguyen(body, "capacity");
        if (capacity != null) {
            room.setCapacity(capacity);
        } else if (batBuoc) {
            room.setCapacity(40);
        }

        String status = chuoi(body, "status");
        if (status != null && !status.isBlank()) {
            room.setStatus(status.trim());
        } else if (batBuoc) {
            room.setStatus("IN_USE");
        }

        if (body.containsKey("classUsing") || body.containsKey("class_using")) {
            room.setClassUsing(trimOrNull(chuoi(body, "classUsing", "class_using")));
        }
        if (body.containsKey("department")) {
            room.setDepartment(trimOrNull(chuoi(body, "department")));
        }
        if (body.containsKey("teacherName") || body.containsKey("teacher_name")) {
            room.setTeacherName(trimOrNull(chuoi(body, "teacherName", "teacher_name")));
        }
        if (body.containsKey("classStudying") || body.containsKey("class_studying")) {
            room.setClassStudying(trimOrNull(chuoi(body, "classStudying", "class_studying")));
        }

        // Không cho chỉnh tay số đếm thiết bị ở bảng rooms.
        // Các chỉ số này được tổng hợp từ bảng assets (nguồn chuẩn).

        if (body.containsKey("glassDoorStatus") || body.containsKey("glass_door_status")) {
            room.setGlassDoorStatus(trimOrNull(chuoi(body, "glassDoorStatus", "glass_door_status")));
        }
        if (body.containsKey("curtainStatus") || body.containsKey("curtain_status")) {
            room.setCurtainStatus(trimOrNull(chuoi(body, "curtainStatus", "curtain_status")));
        }
    }

    private Phong timTheoId(long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phòng."));
    }

    private PhongPhanHoiDto chuyenSangDto(Phong room) {
        return new PhongPhanHoiDto(
                room.getId(),
                room.getRoomCode(),
                room.getBuildingCode(),
                room.getFloor(),
                room.getClassUsing(),
                room.getDepartment(),
                room.getCapacity(),
                room.getStatus(),
                room.getTeacherName(),
                room.getClassStudying(),
                room.getDeskCount(),
                room.getChairCount(),
                room.getSpeakerCount(),
                room.getAirConditionerCount(),
                room.getMicrophoneCount(),
                room.getGlassDoorStatus(),
                room.getCeilingFanCount(),
                room.getCurtainStatus()
        );
    }

    private static String chuoi(Map<String, Object> body, String... keys) {
        for (String key : keys) {
            if (body.containsKey(key) && body.get(key) != null) {
                String s = String.valueOf(body.get(key)).trim();
                if (!s.isEmpty()) {
                    return s;
                }
            }
        }
        return null;
    }

    private static Integer soNguyen(Map<String, Object> body, String... keys) {
        String s = chuoi(body, keys);
        if (s == null) {
            return null;
        }
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String s = value.trim();
        return s.isEmpty() ? null : s;
    }

    private static long tongTheoDanhMuc(List<TongHopLoaiTaiSanDto> rows, String category) {
        if (rows == null || rows.isEmpty() || category == null) return 0L;
        return rows.stream()
                .filter(Objects::nonNull)
                .filter((r) -> category.equalsIgnoreCase(r.itemCategory()))
                .mapToLong(TongHopLoaiTaiSanDto::quantity)
                .sum();
    }

    /** Ưu tiên tổng từ assets; nếu chưa có bản ghi thì lấy cột *_count trên phòng. */
    private static long uuTienPhongHoacTaiSan(long tuTaiSan, Integer tuPhong) {
        if (tuTaiSan > 0) {
            return tuTaiSan;
        }
        if (tuPhong == null || tuPhong <= 0) {
            return 0L;
        }
        return tuPhong.longValue();
    }

    private PhongPhanHoiDto apDungSlot(PhongPhanHoiDto dto, TkbTomTatPhongDto slot) {
        if (slot == null) {
            return doiLopVaGiangVien(dto, "trống", "--");
        }
        String classUsing = slot.classDisplay() != null && !slot.classDisplay().isBlank()
                ? slot.classDisplay()
                : "trống";
        String teacher = slot.teacherDisplay() != null && !slot.teacherDisplay().isBlank()
                ? slot.teacherDisplay()
                : "--";
        return doiLopVaGiangVien(dto, classUsing, teacher);
    }

    private PhongPhanHoiDto doiLopVaGiangVien(PhongPhanHoiDto dto, String classUsing, String teacher) {
        return new PhongPhanHoiDto(
                dto.id(),
                dto.roomCode(),
                dto.buildingCode(),
                dto.floor(),
                classUsing,
                dto.department(),
                dto.capacity(),
                dto.status(),
                teacher,
                classUsing,
                dto.deskCount(),
                dto.chairCount(),
                dto.speakerCount(),
                dto.airConditionerCount(),
                dto.microphoneCount(),
                dto.glassDoorStatus(),
                dto.ceilingFanCount(),
                dto.curtainStatus()
        );
    }
}
