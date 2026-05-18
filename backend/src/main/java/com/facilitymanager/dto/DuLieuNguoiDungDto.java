package com.facilitymanager.dto;

import com.facilitymanager.enums.VaiTroNguoiDung;

/**
 * Dữ liệu người dùng trả ra API (tách khỏi thực thể miền).
 */
public record DuLieuNguoiDungDto(Long ma, String tenDangNhap, String hoTen, VaiTroNguoiDung vaiTro) {
}
