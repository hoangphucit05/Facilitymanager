package com.facilitymanager.entity;

import java.time.LocalDateTime;

import com.facilitymanager.enums.KetQuaNhatKySuKien;

/**
 * Mô hình miền thuần Java — tương ứng {@code com.cateriv.facility.entity.NhatKySuKienEntity}.
 */
public class ThucTheNhatKySuKien {

    private Long maNhatKy;
    private String hanhDong;
    private String doiTuong;
    private Long maDoiTuong;
    private KetQuaNhatKySuKien ketqua;
    private LocalDateTime thoiGian;

    public ThucTheNhatKySuKien() {
    }

    public ThucTheNhatKySuKien(Long maNhatKy, String hanhDong, String doiTuong, Long maDoiTuong,
                              KetQuaNhatKySuKien ketqua, LocalDateTime thoiGian) {
        this.maNhatKy = maNhatKy;
        this.hanhDong = hanhDong;
        this.doiTuong = doiTuong;
        this.maDoiTuong = maDoiTuong;
        this.ketqua = ketqua;
        this.thoiGian = thoiGian;
    }

    public Long getMaNhatKy() {
        return maNhatKy;
    }

    public void setMaNhatKy(Long maNhatKy) {
        this.maNhatKy = maNhatKy;
    }

    public String getHanhDong() {
        return hanhDong;
    }

    public void setHanhDong(String hanhDong) {
        this.hanhDong = hanhDong;
    }

    public String getDoiTuong() {
        return doiTuong;
    }

    public void setDoiTuong(String doiTuong) {
        this.doiTuong = doiTuong;
    }

    public Long getMaDoiTuong() {
        return maDoiTuong;
    }

    public void setMaDoiTuong(Long maDoiTuong) {
        this.maDoiTuong = maDoiTuong;
    }

    public KetQuaNhatKySuKien getKetqua() {
        return ketqua;
    }

    public void setKetqua(KetQuaNhatKySuKien ketqua) {
        this.ketqua = ketqua;
    }

    public LocalDateTime getThoiGian() {
        return thoiGian;
    }

    public void setThoiGian(LocalDateTime thoiGian) {
        this.thoiGian = thoiGian;
    }
}
