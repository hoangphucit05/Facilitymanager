package com.facilitymanager.mapper;

import com.facilitymanager.dto.DuLieuNguoiDungDto;
import com.facilitymanager.entity.ThucTheNguoiDung;
import com.facilitymanager.enums.VaiTroNguoiDung;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-15T22:41:45+0700",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class BienDoiNguoiDungImpl implements BienDoiNguoiDung {

    @Override
    public DuLieuNguoiDungDto chuyenSangDto(ThucTheNguoiDung thucTheNguoiDung) {
        if ( thucTheNguoiDung == null ) {
            return null;
        }

        Long ma = null;
        String tenDangNhap = null;
        String hoTen = null;
        VaiTroNguoiDung vaiTro = null;

        ma = thucTheNguoiDung.getMa();
        tenDangNhap = thucTheNguoiDung.getTenDangNhap();
        hoTen = thucTheNguoiDung.getHoTen();
        vaiTro = thucTheNguoiDung.getVaiTro();

        DuLieuNguoiDungDto duLieuNguoiDungDto = new DuLieuNguoiDungDto( ma, tenDangNhap, hoTen, vaiTro );

        return duLieuNguoiDungDto;
    }
}
