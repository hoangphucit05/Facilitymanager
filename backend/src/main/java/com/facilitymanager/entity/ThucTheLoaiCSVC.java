package com.facilitymanager.entity;

/**
 * Mô hình miền thuần Java — tương ứng {@code com.cateriv.facility.entity.LoaiCSVCEntity}.
 */
public class ThucTheLoaiCSVC {

    private Long maLoai;
    private String tenLoai;
    private String moTa;

    public ThucTheLoaiCSVC() {
    }

    public ThucTheLoaiCSVC(Long maLoai, String tenLoai, String moTa) {
        this.maLoai = maLoai;
        this.tenLoai = tenLoai;
        this.moTa = moTa;
    }

    public Long getMaLoai() {
        return maLoai;
    }

    public void setMaLoai(Long maLoai) {
        this.maLoai = maLoai;
    }

    public String getTenLoai() {
        return tenLoai;
    }

    public void setTenLoai(String tenLoai) {
        this.tenLoai = tenLoai;
    }

    public String getMoTa() {
        return moTa;
    }

    public void setMoTa(String moTa) {
        this.moTa = moTa;
    }
}
