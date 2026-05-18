package com.facilitymanager.vo;

/**
 * Tham số phân trang từ client (số trang, kích thước, cột sắp xếp, thứ tự asc/desc).
 */
public class YeuCauPhanTrang {

    private int soTrang = 1;
    private int kichThuocTrang = 10;
    private String cotSapXep;
    private String thuTu;

    public int getSoTrang() {
        return soTrang;
    }

    public void setSoTrang(int soTrang) {
        this.soTrang = soTrang;
    }

    public int getKichThuocTrang() {
        return kichThuocTrang;
    }

    public void setKichThuocTrang(int kichThuocTrang) {
        this.kichThuocTrang = kichThuocTrang;
    }

    public String getCotSapXep() {
        return cotSapXep;
    }

    public void setCotSapXep(String cotSapXep) {
        this.cotSapXep = cotSapXep;
    }

    public String getThuTu() {
        return thuTu;
    }

    public void setThuTu(String thuTu) {
        this.thuTu = thuTu;
    }
}
