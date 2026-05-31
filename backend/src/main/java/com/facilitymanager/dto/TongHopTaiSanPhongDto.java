package com.facilitymanager.dto;

import java.util.List;

public record TongHopTaiSanPhongDto(
        long roomId,
        String roomCode,
        long totalQuantity,
        long desks,
        long chairs,
        long speakers,
        long airConditioners,
        long microphones,
        List<TongHopLoaiTaiSanDto> breakdown
) {
}
