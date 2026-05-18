package com.facilitymanager.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.facilitymanager.service.DichVuKiemTraSucKhoe;

@RestController
@RequestMapping("/api")
public class DieuKhienKiemTraSucKhoe {

    private final DichVuKiemTraSucKhoe dichVuKiemTraSucKhoe;

    public DieuKhienKiemTraSucKhoe(DichVuKiemTraSucKhoe dichVuKiemTraSucKhoe) {
        this.dichVuKiemTraSucKhoe = dichVuKiemTraSucKhoe;
    }

    /**
     * Trả về trạng thái sống của API (phục vụ giám sát / cân bằng tải).
     *
     * @return map khóa {@code status} với giá trị {@code UP} hoặc {@code DOWN}
     */
    @GetMapping("/health")
    public Map<String, String> traVeTinhTrangSucKhoe() {
        return Map.of("status", dichVuKiemTraSucKhoe.dangHoatDong() ? "UP" : "DOWN");
    }
}
