package com.facilitymanager.dto;

/**
 * JSON camelCase cho frontend (giaoDienApi / main.js).
 */
public record NguoiDungPhanHoiDto(
        Long id,
        String username,
        String fullName,
        String address,
        String phoneNumber,
        String role,
        String status,
        String avatarUrl
) {
}
