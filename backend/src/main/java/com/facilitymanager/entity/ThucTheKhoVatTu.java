package com.facilitymanager.entity;

import java.util.List;

/**
 * Mô hình miền thuần Java — tương ứng {@code com.cateriv.facility.entity.KhoVatTuEntity}.
 */
public class ThucTheKhoVatTu {

    private Long maKho;
    private String tenKho;
    private String viTri;
    private ThucTheNguoiDung nguoiPhuTrach;
    private List<ThucTheVatTuLinhKien> danhSachVatTuLinhKien;

    public ThucTheKhoVatTu() {
    }

    public ThucTheKhoVatTu(Long maKho, String tenKho, String viTri, ThucTheNguoiDung nguoiPhuTrach,
            List<ThucTheVatTuLinhKien> danhSachVatTuLinhKien) {
        this.maKho = maKho;
        this.tenKho = tenKho;
        this.viTri = viTri;
        this.nguoiPhuTrach = nguoiPhuTrach;
        this.danhSachVatTuLinhKien = danhSachVatTuLinhKien;
    }

    public Long getMaKho() {
        return maKho;
    }

    public void setMaKho(Long maKho) {
        this.maKho = maKho;
    }

    public String getTenKho() {
        return tenKho;
    }

    public void setTenKho(String tenKho) {
        this.tenKho = tenKho;
    }

    public String getViTri() {
        return viTri;
    }

    public void setViTri(String viTri) {
        this.viTri = viTri;
    }

    public ThucTheNguoiDung getNguoiPhuTrach() {
        return nguoiPhuTrach;
    }

    public void setNguoiPhuTrach(ThucTheNguoiDung nguoiPhuTrach) {
        this.nguoiPhuTrach = nguoiPhuTrach;
    }

    public List<ThucTheVatTuLinhKien> getDanhSachVatTuLinhKien() {
        return danhSachVatTuLinhKien;
    }

    public void setDanhSachVatTuLinhKien(List<ThucTheVatTuLinhKien> danhSachVatTuLinhKien) {
        this.danhSachVatTuLinhKien = danhSachVatTuLinhKien;
    }
}
