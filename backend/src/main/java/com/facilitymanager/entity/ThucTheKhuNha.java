package com.facilitymanager.entity;

/**
 * Mô hình miền thuần Java (không JPA, không Spring) — tương ứng logic {@code com.cateriv.facility.entity.KhuNhaEntity}.
 */
public class ThucTheKhuNha {

    private Long maKhuNha;
    private String tenKhuNha;
    private String viTri;
    private String moTa;

    public ThucTheKhuNha() {
    }

    public ThucTheKhuNha(Long maKhuNha, String tenKhuNha, String viTri, String moTa) {
        this.maKhuNha = maKhuNha;
        this.tenKhuNha = tenKhuNha;
        this.viTri = viTri;
        this.moTa = moTa;
    }

    public Long getMaKhuNha() {
        return maKhuNha;
    }

    public void setMaKhuNha(Long maKhuNha) {
        this.maKhuNha = maKhuNha;
    }

    public String getTenKhuNha() {
        return tenKhuNha;
    }

    public void setTenKhuNha(String tenKhuNha) {
        this.tenKhuNha = tenKhuNha;
    }

    public String getViTri() {
        return viTri;
    }

    public void setViTri(String viTri) {
        this.viTri = viTri;
    }

    public String getMoTa() {
        return moTa;
    }

    public void setMoTa(String moTa) {
        this.moTa = moTa;
    }
}
