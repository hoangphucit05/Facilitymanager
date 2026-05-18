package com.facilitymanager.entity;

import java.math.BigDecimal;

/**
 * Thực thể dòng chi tiết trên phiếu bảo trì / sửa chữa.
 */
public class ThucTheChiTietPhieu {

    private Long ma;
    private Integer soLuong;
    private BigDecimal donGia;
    private BigDecimal thanhTien;
    private ThucThePhieuBaoTriSuaChua phieuBaoTriSuaChua;
    private ThucTheVatTuLinhKien vatTuLinhKien;

    public ThucTheChiTietPhieu() {
    }

    public ThucTheChiTietPhieu(Long ma, Integer soLuong, BigDecimal donGia, BigDecimal thanhTien,
            ThucThePhieuBaoTriSuaChua phieuBaoTriSuaChua, ThucTheVatTuLinhKien vatTuLinhKien) {
        this.ma = ma;
        this.soLuong = soLuong;
        this.donGia = donGia;
        this.thanhTien = thanhTien;
        this.phieuBaoTriSuaChua = phieuBaoTriSuaChua;
        this.vatTuLinhKien = vatTuLinhKien;
    }

    public Long getMa() {
        return ma;
    }

    public void setMa(Long ma) {
        this.ma = ma;
    }

    public Integer getSoLuong() {
        return soLuong;
    }

    public void setSoLuong(Integer soLuong) {
        this.soLuong = soLuong;
    }

    public BigDecimal getDonGia() {
        return donGia;
    }

    public void setDonGia(BigDecimal donGia) {
        this.donGia = donGia;
    }

    public BigDecimal getThanhTien() {
        return thanhTien;
    }

    public void setThanhTien(BigDecimal thanhTien) {
        this.thanhTien = thanhTien;
    }

    public ThucThePhieuBaoTriSuaChua getPhieuBaoTriSuaChua() {
        return phieuBaoTriSuaChua;
    }

    public void setPhieuBaoTriSuaChua(ThucThePhieuBaoTriSuaChua phieuBaoTriSuaChua) {
        this.phieuBaoTriSuaChua = phieuBaoTriSuaChua;
    }

    public ThucTheVatTuLinhKien getVatTuLinhKien() {
        return vatTuLinhKien;
    }

    public void setVatTuLinhKien(ThucTheVatTuLinhKien vatTuLinhKien) {
        this.vatTuLinhKien = vatTuLinhKien;
    }
}
