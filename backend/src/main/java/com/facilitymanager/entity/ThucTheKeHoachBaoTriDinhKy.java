package com.facilitymanager.entity;

import java.time.LocalDate;

import com.facilitymanager.enums.HinhThucBaoTri;

/**
 * Mô hình miền thuần Java — tương ứng {@code com.cateriv.facility.entity.KeHoachBaoTriDinhKyEntity}.
 */
public class ThucTheKeHoachBaoTriDinhKy {

    private Long maKeHoach;
    private HinhThucBaoTri hinhThucBaoTri;
    private Integer chuKyNgay;
    private LocalDate ngayBaoTriKeTiep;
    private ThucTheCoSoVatChat coSoVatChat;

    public ThucTheKeHoachBaoTriDinhKy() {
    }

    public ThucTheKeHoachBaoTriDinhKy(Long maKeHoach, HinhThucBaoTri hinhThucBaoTri, Integer chuKyNgay,
            LocalDate ngayBaoTriKeTiep, ThucTheCoSoVatChat coSoVatChat) {
        this.maKeHoach = maKeHoach;
        this.hinhThucBaoTri = hinhThucBaoTri;
        this.chuKyNgay = chuKyNgay;
        this.ngayBaoTriKeTiep = ngayBaoTriKeTiep;
        this.coSoVatChat = coSoVatChat;
    }

    public Long getMaKeHoach() {
        return maKeHoach;
    }

    public void setMaKeHoach(Long maKeHoach) {
        this.maKeHoach = maKeHoach;
    }

    public HinhThucBaoTri getHinhThucBaoTri() {
        return hinhThucBaoTri;
    }

    public void setHinhThucBaoTri(HinhThucBaoTri hinhThucBaoTri) {
        this.hinhThucBaoTri = hinhThucBaoTri;
    }

    public Integer getChuKyNgay() {
        return chuKyNgay;
    }

    public void setChuKyNgay(Integer chuKyNgay) {
        this.chuKyNgay = chuKyNgay;
    }

    public LocalDate getNgayBaoTriKeTiep() {
        return ngayBaoTriKeTiep;
    }

    public void setNgayBaoTriKeTiep(LocalDate ngayBaoTriKeTiep) {
        this.ngayBaoTriKeTiep = ngayBaoTriKeTiep;
    }

    public ThucTheCoSoVatChat getCoSoVatChat() {
        return coSoVatChat;
    }

    public void setCoSoVatChat(ThucTheCoSoVatChat coSoVatChat) {
        this.coSoVatChat = coSoVatChat;
    }
}
