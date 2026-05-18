package com.facilitymanager.dto;

/**
 * JSON camelCase cho frontend (giaoDienApi / room-helpers).
 */
public record PhongPhanHoiDto(
        Long id,
        String roomCode,
        String buildingCode,
        Integer floor,
        String classUsing,
        String department,
        Integer capacity,
        String status,
        String teacherName,
        String classStudying,
        Integer deskCount,
        Integer chairCount,
        Integer speakerCount,
        Integer airConditionerCount,
        Integer microphoneCount,
        String glassDoorStatus,
        Integer ceilingFanCount,
        String curtainStatus
) {
}
