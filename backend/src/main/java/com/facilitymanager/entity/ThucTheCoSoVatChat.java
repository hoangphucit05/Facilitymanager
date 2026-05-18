package com.facilitymanager.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.facilitymanager.enums.TinhTrangCSVC;

/**
 * Mô hình miền thuần Java — tương ứng {@code com.cateriv.facility.entity.CoSoVatChatEntity}.
 */
public class ThucTheCoSoVatChat {

    private Long ma;
    private String maHieu;
    private String tenCSVC;
    private String nhaSanXuat;
    private LocalDate ngayMua;
    private LocalDate ngayHetBaoHanh;
    private BigDecimal nguyenGia;
    private Integer soLuong;
    private TinhTrangCSVC tinhTrang;
    private String ghiChu;
    private ThucThePhongHoc phong;
    private ThucTheNhaCungCap nhaCungCap;
    private ThucTheLoaiCSVC loaiCSVC;

    public ThucTheCoSoVatChat() {
    }

    public ThucTheCoSoVatChat(Long ma, String maHieu, String tenCSVC, String nhaSanXuat, LocalDate ngayMua,
                            LocalDate ngayHetBaoHanh, BigDecimal nguyenGia, Integer soLuong,
                            TinhTrangCSVC tinhTrang, String ghiChu, ThucThePhongHoc phong,
                            ThucTheNhaCungCap nhaCungCap, ThucTheLoaiCSVC loaiCSVC) {
        this.ma = ma;
        this.maHieu = maHieu;
        this.tenCSVC = tenCSVC;
        this.nhaSanXuat = nhaSanXuat;
        this.ngayMua = ngayMua;
        this.ngayHetBaoHanh = ngayHetBaoHanh;
        this.nguyenGia = nguyenGia;
        this.soLuong = soLuong;
        this.tinhTrang = tinhTrang;
        this.ghiChu = ghiChu;
        this.phong = phong;
        this.nhaCungCap = nhaCungCap;
        this.loaiCSVC = loaiCSVC;
    }

    public Long getMa() {
        return ma;
    }

    public void setMa(Long ma) {
        this.ma = ma;
    }

    public String getMaHieu() {
        return maHieu;
    }

    public void setMaHieu(String maHieu) {
        this.maHieu = maHieu;
    }

    public String getTenCSVC() {
        return tenCSVC;
    }

    public void setTenCSVC(String tenCSVC) {
        this.tenCSVC = tenCSVC;
    }

    public String getNhaSanXuat() {
        return nhaSanXuat;
    }

    public void setNhaSanXuat(String nhaSanXuat) {
        this.nhaSanXuat = nhaSanXuat;
    }

    public LocalDate getNgayMua() {
        return ngayMua;
    }

    public void setNgayMua(LocalDate ngayMua) {
        this.ngayMua = ngayMua;
    }

    public LocalDate getNgayHetBaoHanh() {
        return ngayHetBaoHanh;
    }

    public void setNgayHetBaoHanh(LocalDate ngayHetBaoHanh) {
        this.ngayHetBaoHanh = ngayHetBaoHanh;
    }

    public BigDecimal getNguyenGia() {
        return nguyenGia;
    }

    public void setNguyenGia(BigDecimal nguyenGia) {
        this.nguyenGia = nguyenGia;
    }

    public Integer getSoLuong() {
        return soLuong;
    }

    public void setSoLuong(Integer soLuong) {
        this.soLuong = soLuong;
    }

    public TinhTrangCSVC getTinhTrang() {
        return tinhTrang;
    }

    public void setTinhTrang(TinhTrangCSVC tinhTrang) {
        this.tinhTrang = tinhTrang;
    }

    public String getGhiChu() {
        return ghiChu;
    }

    public void setGhiChu(String ghiChu) {
        this.ghiChu = ghiChu;
    }

    public ThucThePhongHoc getPhong() {
        return phong;
    }

    public void setPhong(ThucThePhongHoc phong) {
        this.phong = phong;
    }

    public ThucTheNhaCungCap getNhaCungCap() {
        return nhaCungCap;
    }

    public void setNhaCungCap(ThucTheNhaCungCap nhaCungCap) {
        this.nhaCungCap = nhaCungCap;
    }

    public ThucTheLoaiCSVC getLoaiCSVC() {
        return loaiCSVC;
    }

    public void setLoaiCSVC(ThucTheLoaiCSVC loaiCSVC) {
        this.loaiCSVC = loaiCSVC;
    }
}
