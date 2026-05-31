package com.facilitymanager.dto;

public record LopDangHocDto(
        String roomCode,
        Integer weekday,
        Integer currentPeriod,
        String shift,
        String periodLabel,
        String ownerUnit,
        String usageLabel,
        String teacherName,
        String semester
) {
}
