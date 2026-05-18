package com.facilitymanager.entity;

import java.math.BigDecimal;

/**
 * Mô hình miền thuần Java — tương ứng {@code com.cateriv.facility.entity.VatTuLinhKienEntity}.
 */
public class ThucTheVatTuLinhKien {

    private Long maVatTu;
    private String tenVatTu;
    private String donViTinh;
    private Integer soLuongTon;
    private Integer mucCanhBaoToiThieu;
    private BigDecimal donGia;
    private ThucTheKhoVatTu khoHang;

    public ThucTheVatTuLinhKien() {
    }

    public ThucTheVatTuLinhKien(Long maVatTu, String tenVatTu, String donViTinh, Integer soLuongTon,
            Integer mucCanhBaoToiThieu, BigDecimal donGia, ThucTheKhoVatTu khoHang) {
        this.maVatTu = maVatTu;
        this.tenVatTu = tenVatTu;
        this.donViTinh = donViTinh;
        this.soLuongTon = soLuongTon;
        this.mucCanhBaoToiThieu = mucCanhBaoToiThieu;
        this.donGia = donGia;
        this.khoHang = khoHang;
    }

    public Long getMaVatTu() {
        return maVatTu;
    }

    public void setMaVatTu(Long maVatTu) {
        this.maVatTu = maVatTu;
    }

    public String getTenVatTu() {
        return tenVatTu;
    }

    public void setTenVatTu(String tenVatTu) {
        this.tenVatTu = tenVatTu;
    }

    public String getDonViTinh() {
        return donViTinh;
    }

    public void setDonViTinh(String donViTinh) {
        this.donViTinh = donViTinh;
    }

    public Integer getSoLuongTon() {
        return soLuongTon;
    }

    public void setSoLuongTon(Integer soLuongTon) {
        this.soLuongTon = soLuongTon;
    }

    public Integer getMucCanhBaoToiThieu() {
        return mucCanhBaoToiThieu;
    }

    public void setMucCanhBaoToiThieu(Integer mucCanhBaoToiThieu) {
        this.mucCanhBaoToiThieu = mucCanhBaoToiThieu;
    }

    public BigDecimal getDonGia() {
        return donGia;
    }

    public void setDonGia(BigDecimal donGia) {
        this.donGia = donGia;
    }

    public ThucTheKhoVatTu getKhoHang() {
        return khoHang;
    }

    public void setKhoHang(ThucTheKhoVatTu khoHang) {
        this.khoHang = khoHang;
    }
}
