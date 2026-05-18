package com.facilitymanager.entity;

import java.util.List;

/**
 * Mô hình miền thuần Java — tương ứng {@code com.cateriv.facility.entity.NhaCungCapEntity}.
 */
public class ThucTheNhaCungCap {

    private Long ma;
    private String tenNCC;
    private String nguoiLienHe;
    private String soDienThoai;
    private String thuDienTu;
    private String diaChi;
    private List<ThucTheCoSoVatChat> danhSachCSVC;

    public ThucTheNhaCungCap() {
    }

    public ThucTheNhaCungCap(Long ma, String tenNCC, String nguoiLienHe, String soDienThoai, String thuDienTu, String diaChi,
                            List<ThucTheCoSoVatChat> danhSachCSVC) {
        this.ma = ma;
        this.tenNCC = tenNCC;
        this.nguoiLienHe = nguoiLienHe;
        this.soDienThoai = soDienThoai;
        this.thuDienTu = thuDienTu;
        this.diaChi = diaChi;
        this.danhSachCSVC = danhSachCSVC;
    }

    public Long getMa() {
        return ma;
    }

    public void setMa(Long ma) {
        this.ma = ma;
    }

    public String getTenNCC() {
        return tenNCC;
    }

    public void setTenNCC(String tenNCC) {
        this.tenNCC = tenNCC;
    }

    public String getNguoiLienHe() {
        return nguoiLienHe;
    }

    public void setNguoiLienHe(String nguoiLienHe) {
        this.nguoiLienHe = nguoiLienHe;
    }

    public String getSoDienThoai() {
        return soDienThoai;
    }

    public void setSoDienThoai(String soDienThoai) {
        this.soDienThoai = soDienThoai;
    }

    public String getThuDienTu() {
        return thuDienTu;
    }

    public void setThuDienTu(String thuDienTu) {
        this.thuDienTu = thuDienTu;
    }

    public String getDiaChi() {
        return diaChi;
    }

    public void setDiaChi(String diaChi) {
        this.diaChi = diaChi;
    }

    public List<ThucTheCoSoVatChat> getDanhSachCSVC() {
        return danhSachCSVC;
    }

    public void setDanhSachCSVC(List<ThucTheCoSoVatChat> danhSachCSVC) {
        this.danhSachCSVC = danhSachCSVC;
    }
}
