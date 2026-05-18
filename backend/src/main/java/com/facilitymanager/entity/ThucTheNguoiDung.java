package com.facilitymanager.entity;

import java.time.LocalDateTime;

import com.facilitymanager.enums.VaiTroNguoiDung;

/**
 * Thực thể người dùng trong miền nghiệp vụ (POJO, chưa gắn JPA).
 */
public class ThucTheNguoiDung {

    private Long ma;
    private String tenDangNhap;
    private String matKhau;
    private String thuDienTu;
    private String hoTen;
    private String soDienThoai;
    private VaiTroNguoiDung vaiTro;
    private Boolean trangThai;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;
    private String ghiChu;

    public ThucTheNguoiDung() {
    }

    public ThucTheNguoiDung(String tenDangNhap, String matKhau, String thuDienTu, String hoTen,
            String soDienThoai, VaiTroNguoiDung vaiTro) {
        this.tenDangNhap = tenDangNhap;
        this.matKhau = matKhau;
        this.thuDienTu = thuDienTu;
        this.hoTen = hoTen;
        this.soDienThoai = soDienThoai;
        this.vaiTro = vaiTro;
    }

    public Long getMa() {
        return ma;
    }

    public void setMa(Long ma) {
        this.ma = ma;
    }

    public String getTenDangNhap() {
        return tenDangNhap;
    }

    public void setTenDangNhap(String tenDangNhap) {
        this.tenDangNhap = tenDangNhap;
    }

    public String getMatKhau() {
        return matKhau;
    }

    public void setMatKhau(String matKhau) {
        this.matKhau = matKhau;
    }

    public String getThuDienTu() {
        return thuDienTu;
    }

    public void setThuDienTu(String thuDienTu) {
        this.thuDienTu = thuDienTu;
    }

    public String getHoTen() {
        return hoTen;
    }

    public void setHoTen(String hoTen) {
        this.hoTen = hoTen;
    }

    public String getSoDienThoai() {
        return soDienThoai;
    }

    public void setSoDienThoai(String soDienThoai) {
        this.soDienThoai = soDienThoai;
    }

    public VaiTroNguoiDung getVaiTro() {
        return vaiTro;
    }

    public void setVaiTro(VaiTroNguoiDung vaiTro) {
        this.vaiTro = vaiTro;
    }

    public Boolean getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(Boolean trangThai) {
        this.trangThai = trangThai;
    }

    public LocalDateTime getNgayTao() {
        return ngayTao;
    }

    public void setNgayTao(LocalDateTime ngayTao) {
        this.ngayTao = ngayTao;
    }

    public LocalDateTime getNgayCapNhat() {
        return ngayCapNhat;
    }

    public void setNgayCapNhat(LocalDateTime ngayCapNhat) {
        this.ngayCapNhat = ngayCapNhat;
    }

    public String getGhiChu() {
        return ghiChu;
    }

    public void setGhiChu(String ghiChu) {
        this.ghiChu = ghiChu;
    }
}
