package com.facilitymanager.dto;

import java.time.Instant;

/**
 * Gói thông tin lỗi trả về cho client khi có ngoại lệ xử lý tập trung.
 */
public record DuLieuLoiApi(
        Instant thoiDiem,
        int maTrangThai,
        String loaiLoi,
        String thongDiep,
        String duongDan) {
}
