package com.facilitymanager.dto;

public record LichPhongPhanHoiDto(
        Long id,
        String roomCode,
        Integer weekday,
        String shift,
        String periodLabel,
        Integer periodStart,
        Integer periodEnd,
        String ownerUnit,
        String usageLabel,
        String teacherName,
        String semester
) {
}
