package com.facilitymanager.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import com.facilitymanager.dto.DuLieuNguoiDungDto;
import com.facilitymanager.entity.ThucTheNguoiDung;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BienDoiNguoiDung {

    /**
     * Chuyển thực thể người dùng sang DTO phục vụ lớp điều khiển / phản hồi HTTP.
     *
     * @param thucTheNguoiDung bản ghi miền nguồn
     * @return DTO tương ứng
     */
    DuLieuNguoiDungDto chuyenSangDto(ThucTheNguoiDung thucTheNguoiDung);
}
