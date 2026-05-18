package com.facilitymanager.service;

import com.facilitymanager.dto.PhongPhanHoiDto;
import com.facilitymanager.entity.Room;
import com.facilitymanager.repository.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class DichVuQuanLyPhong {

    private final RoomRepository roomRepository;

    public DichVuQuanLyPhong(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<PhongPhanHoiDto> layDanhSach(String buildingCode) {
        List<Room> list;
        if (buildingCode != null && !buildingCode.isBlank()) {
            list = roomRepository.findByBuildingCodeOrderByRoomCodeAsc(buildingCode.trim());
        } else {
            list = roomRepository.findAll();
        }
        return list.stream().map(this::chuyenSangDto).toList();
    }

    @Transactional(readOnly = true)
    public PhongPhanHoiDto layTheoId(long id) {
        return chuyenSangDto(timTheoId(id));
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
        Room room = new Room();
        room.setRoomCode(roomCode);
        apDungTuMap(room, body, true);
        return chuyenSangDto(roomRepository.save(room));
    }

    @Transactional
    public PhongPhanHoiDto capNhat(long id, Map<String, Object> body) {
        Room room = timTheoId(id);
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

    private void apDungTuMap(Room room, Map<String, Object> body, boolean batBuoc) {
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

        Integer desks = soNguyen(body, "deskCount", "desk_count");
        if (desks != null) {
            room.setDeskCount(desks);
        }
        Integer chairs = soNguyen(body, "chairCount", "chair_count");
        if (chairs != null) {
            room.setChairCount(chairs);
        }
        Integer speakers = soNguyen(body, "speakerCount", "speaker_count");
        if (speakers != null) {
            room.setSpeakerCount(speakers);
        }
        Integer ac = soNguyen(body, "airConditionerCount", "air_conditioner_count");
        if (ac != null) {
            room.setAirConditionerCount(ac);
        }
        Integer mic = soNguyen(body, "microphoneCount", "microphone_count");
        if (mic != null) {
            room.setMicrophoneCount(mic);
        }
        Integer fan = soNguyen(body, "ceilingFanCount", "ceiling_fan_count");
        if (fan != null) {
            room.setCeilingFanCount(fan);
        }

        if (body.containsKey("glassDoorStatus") || body.containsKey("glass_door_status")) {
            room.setGlassDoorStatus(trimOrNull(chuoi(body, "glassDoorStatus", "glass_door_status")));
        }
        if (body.containsKey("curtainStatus") || body.containsKey("curtain_status")) {
            room.setCurtainStatus(trimOrNull(chuoi(body, "curtainStatus", "curtain_status")));
        }
    }

    private Room timTheoId(long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phòng."));
    }

    private PhongPhanHoiDto chuyenSangDto(Room room) {
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
}
