package com.facilitymanager.controller;

import com.facilitymanager.dto.PhongPhanHoiDto;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class DieuKhienPhong {

    private final DichVuQuanLyPhong dichVuQuanLyPhong;

    public DieuKhienPhong(DichVuQuanLyPhong dichVuQuanLyPhong) {
        this.dichVuQuanLyPhong = dichVuQuanLyPhong;
    }

    @GetMapping
    public List<PhongPhanHoiDto> layDanhSach(
            @RequestParam(value = "building", required = false) String building,
            @RequestParam(value = "buildingCode", required = false) String buildingCode
    ) {
        String code = building != null && !building.isBlank() ? building : buildingCode;
        return dichVuQuanLyPhong.layDanhSach(code);
    }

    @GetMapping("/{roomId}")
    public PhongPhanHoiDto layTheoId(@PathVariable("roomId") long roomId) {
        return dichVuQuanLyPhong.layTheoId(roomId);
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
