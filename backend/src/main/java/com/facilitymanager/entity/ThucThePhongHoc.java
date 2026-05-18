package com.facilitymanager.entity;

import java.util.List;

import com.facilitymanager.enums.TrangThaiPhongHoc;

/**
 * Mô hình miền thuần Java — tương ứng {@code com.cateriv.facility.entity.PhongHocEntity}.
 */
public class ThucThePhongHoc {

    private Long ma;
    private String tenPhong;
    private String toaNha;
    private Integer tang;
    private Integer sucChua;
    private String loaiPhong;
    private TrangThaiPhongHoc trangThai;
    private ThucTheKhuNha khuNha;
    private List<ThucTheCoSoVatChat> danhSachCSVC;

    public ThucThePhongHoc() {
    }

    public ThucThePhongHoc(Long ma, String tenPhong, String toaNha, Integer tang, Integer sucChua, String loaiPhong,
                          TrangThaiPhongHoc trangThai, ThucTheKhuNha khuNha, List<ThucTheCoSoVatChat> danhSachCSVC) {
        this.ma = ma;
        this.tenPhong = tenPhong;
        this.toaNha = toaNha;
        this.tang = tang;
        this.sucChua = sucChua;
        this.loaiPhong = loaiPhong;
        this.trangThai = trangThai;
        this.khuNha = khuNha;
        this.danhSachCSVC = danhSachCSVC;
    }

    public Long getMa() {
        return ma;
    }

    public void setMa(Long ma) {
        this.ma = ma;
    }

    public String getTenPhong() {
        return tenPhong;
    }

    public void setTenPhong(String tenPhong) {
        this.tenPhong = tenPhong;
    }

    public String getToaNha() {
        return toaNha;
    }

    public void setToaNha(String toaNha) {
        this.toaNha = toaNha;
    }

    public Integer getTang() {
        return tang;
    }

    public void setTang(Integer tang) {
        this.tang = tang;
    }

    public Integer getSucChua() {
        return sucChua;
    }

    public void setSucChua(Integer sucChua) {
        this.sucChua = sucChua;
    }

    public String getLoaiPhong() {
        return loaiPhong;
    }

    public void setLoaiPhong(String loaiPhong) {
        this.loaiPhong = loaiPhong;
    }

    public TrangThaiPhongHoc getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(TrangThaiPhongHoc trangThai) {
        this.trangThai = trangThai;
    }

    public ThucTheKhuNha getKhuNha() {
        return khuNha;
    }

    public void setKhuNha(ThucTheKhuNha khuNha) {
        this.khuNha = khuNha;
    }

    public List<ThucTheCoSoVatChat> getDanhSachCSVC() {
        return danhSachCSVC;
    }

    public void setDanhSachCSVC(List<ThucTheCoSoVatChat> danhSachCSVC) {
        this.danhSachCSVC = danhSachCSVC;
    }
}
