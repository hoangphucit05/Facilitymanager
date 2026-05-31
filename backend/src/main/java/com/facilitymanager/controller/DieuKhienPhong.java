package com.facilitymanager.controller;

import com.facilitymanager.dto.LichPhongPhanHoiDto;
import com.facilitymanager.dto.LopDangHocDto;
import com.facilitymanager.dto.PhongPhanHoiDto;
import com.facilitymanager.dto.TongHopTaiSanPhongDto;
import com.facilitymanager.service.DichVuLichPhong;
import com.facilitymanager.service.DichVuQuanLyPhong;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class DieuKhienPhong {

    private final DichVuQuanLyPhong dichVuQuanLyPhong;
    private final DichVuLichPhong dichVuLichPhong;

    public DieuKhienPhong(DichVuQuanLyPhong dichVuQuanLyPhong, DichVuLichPhong dichVuLichPhong) {
        this.dichVuQuanLyPhong = dichVuQuanLyPhong;
        this.dichVuLichPhong = dichVuLichPhong;
    }

    @GetMapping
    public List<PhongPhanHoiDto> layDanhSach(
            @RequestParam(value = "building", required = false) String building,
            @RequestParam(value = "buildingCode", required = false) String buildingCode,
            @RequestParam(value = "week", required = false) Integer week,
            @RequestParam(value = "semester", required = false) String semester,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "shift", required = false) String shift
    ) {
        String code = building != null && !building.isBlank() ? building : buildingCode;
        LocalDate parsedDate = null;
        if (date != null && !date.isBlank()) {
            parsedDate = LocalDate.parse(date.trim());
        }
        return dichVuQuanLyPhong.layDanhSach(code, week, semester, parsedDate, shift);
    }

    @GetMapping("/code/{roomCode}/schedule")
    public List<LichPhongPhanHoiDto> layLichTheoPhong(@PathVariable("roomCode") String roomCode) {
        return dichVuLichPhong.layLichTheoPhong(roomCode);
    }

    @GetMapping("/code/{roomCode}/current-class")
    public LopDangHocDto layLopDangHoc(
            @PathVariable("roomCode") String roomCode,
            @RequestParam(value = "at", required = false) String at
    ) {
        LocalDateTime time = null;
        if (at != null && !at.isBlank()) {
            time = LocalDateTime.parse(at.trim());
        }
        return dichVuLichPhong.layLopDangHoc(roomCode, time);
    }

    @GetMapping("/{roomId}")
    public PhongPhanHoiDto layTheoId(
            @PathVariable("roomId") long roomId,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "shift", required = false) String shift,
            @RequestParam(value = "semester", required = false) String semester
    ) {
        LocalDate parsedDate = null;
        if (date != null && !date.isBlank()) {
            parsedDate = LocalDate.parse(date.trim());
        }
        return dichVuQuanLyPhong.layTheoId(roomId, parsedDate, semester, shift);
    }

    @GetMapping("/{roomId}/asset-summary")
    public TongHopTaiSanPhongDto layTongHopTaiSan(@PathVariable("roomId") long roomId) {
        return dichVuQuanLyPhong.layTongHopTaiSanTheoPhong(roomId);
    }

    @PostMapping
    public ResponseEntity<PhongPhanHoiDto> tao(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(dichVuQuanLyPhong.tao(body));
    }

    @PutMapping("/{roomId}")
    public PhongPhanHoiDto capNhat(@PathVariable("roomId") long roomId, @RequestBody Map<String, Object> body) {
        return dichVuQuanLyPhong.capNhat(roomId, body);
    }

    @PatchMapping("/{roomId}")
    public PhongPhanHoiDto capNhatMotPhan(@PathVariable("roomId") long roomId, @RequestBody Map<String, Object> body) {
        return dichVuQuanLyPhong.capNhatMotPhan(roomId, body);
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> xoa(@PathVariable("roomId") long roomId) {
        dichVuQuanLyPhong.xoa(roomId);
        return ResponseEntity.noContent().build();
    }
}
