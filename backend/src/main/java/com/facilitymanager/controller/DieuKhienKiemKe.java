package com.facilitymanager.controller;

import com.facilitymanager.dto.DotKiemKeDto;
import com.facilitymanager.security.BoLocPhienToken;
import com.facilitymanager.service.DichVuKiemKe;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audits")
@CrossOrigin(origins = "*")
public class DieuKhienKiemKe {

    private final DichVuKiemKe dichVuKiemKe;

    public DieuKhienKiemKe(DichVuKiemKe dichVuKiemKe) {
        this.dichVuKiemKe = dichVuKiemKe;
    }

    @GetMapping
    public List<DotKiemKeDto> list() {
        return dichVuKiemKe.danhSach();
    }

    @GetMapping("/{id}")
    public DotKiemKeDto getById(@PathVariable Long id) {
        return dichVuKiemKe.chiTiet(id);
    }

    @PostMapping
    public ResponseEntity<DotKiemKeDto> create(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        DotKiemKeDto saved = dichVuKiemKe.tao(body, userId(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}/details")
    public DotKiemKeDto updateDetails(
            @PathVariable Long id,
            @RequestBody List<Map<String, Object>> rows
    ) {
        return dichVuKiemKe.capNhatChiTiet(id, rows != null ? rows : List.of());
    }

    @PostMapping("/{id}/complete")
    public DotKiemKeDto complete(@PathVariable Long id) {
        return dichVuKiemKe.hoanTat(id);
    }

    @GetMapping("/{id}/export")
    public Map<String, Object> export(@PathVariable Long id) {
        return dichVuKiemKe.xuatJson(id);
    }

    private static Long userId(HttpServletRequest request) {
        Object v = request.getAttribute(BoLocPhienToken.ATTR_USER_ID);
        if (v instanceof Long l) {
            return l;
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        return null;
    }
}
