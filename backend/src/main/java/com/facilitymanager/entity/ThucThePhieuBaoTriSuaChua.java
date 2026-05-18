package com.facilitymanager.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.facilitymanager.enums.MucDoUuTienPhieu;
import com.facilitymanager.enums.TrangThaiPhieu;

/**
 * Mô hình miền thuần Java — tương ứng {@code com.cateriv.facility.entity.PhieuBaoTriSuaChuaEntity}.
 */
public class ThucThePhieuBaoTriSuaChua {

    private Long maPhieu;
    private String noiDung;
    private MucDoUuTienPhieu mucDoUuTien;
    private TrangThaiPhieu trangThai;
    private LocalDateTime ngayYeuCau;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayHoanThanh;
    private BigDecimal tongChiPhi;
    private ThucTheCoSoVatChat coSoVatChat;
    private ThucTheNguoiDung nguoiYeuCau;
    private List<ThucTheChiTietPhieu> chiTiet;

    public ThucThePhieuBaoTriSuaChua() {
    }

    public ThucThePhieuBaoTriSuaChua(Long maPhieu, String noiDung, MucDoUuTienPhieu mucDoUuTien,
            TrangThaiPhieu trangThai, LocalDateTime ngayYeuCau, LocalDateTime ngayBatDau,
            LocalDateTime ngayHoanThanh, BigDecimal tongChiPhi, ThucTheCoSoVatChat coSoVatChat,
            ThucTheNguoiDung nguoiYeuCau, List<ThucTheChiTietPhieu> chiTiet) {
        this.maPhieu = maPhieu;
        this.noiDung = noiDung;
        this.mucDoUuTien = mucDoUuTien;
        this.trangThai = trangThai;
        this.ngayYeuCau = ngayYeuCau;
        this.ngayBatDau = ngayBatDau;
        this.ngayHoanThanh = ngayHoanThanh;
        this.tongChiPhi = tongChiPhi;
        this.coSoVatChat = coSoVatChat;
        this.nguoiYeuCau = nguoiYeuCau;
        this.chiTiet = chiTiet;
    }

    public Long getMaPhieu() {
        return maPhieu;
    }

    public void setMaPhieu(Long maPhieu) {
        this.maPhieu = maPhieu;
    }

    public String getNoiDung() {
        return noiDung;
    }

    public void setNoiDung(String noiDung) {
        this.noiDung = noiDung;
    }

    public MucDoUuTienPhieu getMucDoUuTien() {
        return mucDoUuTien;
    }

    public void setMucDoUuTien(MucDoUuTienPhieu mucDoUuTien) {
        this.mucDoUuTien = mucDoUuTien;
    }

    public TrangThaiPhieu getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(TrangThaiPhieu trangThai) {
        this.trangThai = trangThai;
    }

    public LocalDateTime getNgayYeuCau() {
        return ngayYeuCau;
    }

    public void setNgayYeuCau(LocalDateTime ngayYeuCau) {
        this.ngayYeuCau = ngayYeuCau;
    }

    public LocalDateTime getNgayBatDau() {
        return ngayBatDau;
    }

    public void setNgayBatDau(LocalDateTime ngayBatDau) {
        this.ngayBatDau = ngayBatDau;
    }

    public LocalDateTime getNgayHoanThanh() {
        return ngayHoanThanh;
    }

    public void setNgayHoanThanh(LocalDateTime ngayHoanThanh) {
        this.ngayHoanThanh = ngayHoanThanh;
    }

    public BigDecimal getTongChiPhi() {
        return tongChiPhi;
    }

    public void setTongChiPhi(BigDecimal tongChiPhi) {
        this.tongChiPhi = tongChiPhi;
    }

    public ThucTheCoSoVatChat getCoSoVatChat() {
        return coSoVatChat;
    }

    public void setCoSoVatChat(ThucTheCoSoVatChat coSoVatChat) {
        this.coSoVatChat = coSoVatChat;
    }

    public ThucTheNguoiDung getNguoiYeuCau() {
        return nguoiYeuCau;
    }

    public void setNguoiYeuCau(ThucTheNguoiDung nguoiYeuCau) {
        this.nguoiYeuCau = nguoiYeuCau;
    }

    public List<ThucTheChiTietPhieu> getChiTiet() {
        return chiTiet;
    }

    public void setChiTiet(List<ThucTheChiTietPhieu> chiTiet) {
        this.chiTiet = chiTiet;
    }
}
