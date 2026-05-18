package com.facilitymanager.entity;

import java.time.LocalDateTime;

import com.facilitymanager.enums.LoaiThongBaoHeThong;

/**
 * Mô hình miền thuần Java — tương ứng {@code com.cateriv.facility.entity.ThongBaoHeThongEntity}.
 */
public class ThucTheThongBaoHeThong {

    private Long maThongBao;
    private LoaiThongBaoHeThong loaiThongBao;
    private String noiDung;
    private Boolean daDoc;
    private LocalDateTime thoiGianGui;

    public ThucTheThongBaoHeThong() {
    }

    public ThucTheThongBaoHeThong(Long maThongBao, LoaiThongBaoHeThong loaiThongBao, String noiDung, Boolean daDoc,
                                 LocalDateTime thoiGianGui) {
        this.maThongBao = maThongBao;
        this.loaiThongBao = loaiThongBao;
        this.noiDung = noiDung;
        this.daDoc = daDoc;
        this.thoiGianGui = thoiGianGui;
    }

    public Long getMaThongBao() {
        return maThongBao;
    }

    public void setMaThongBao(Long maThongBao) {
        this.maThongBao = maThongBao;
    }

    public LoaiThongBaoHeThong getLoaiThongBao() {
        return loaiThongBao;
    }

    public void setLoaiThongBao(LoaiThongBaoHeThong loaiThongBao) {
        this.loaiThongBao = loaiThongBao;
    }

    public String getNoiDung() {
        return noiDung;
    }

    public void setNoiDung(String noiDung) {
        this.noiDung = noiDung;
    }

    public Boolean getDaDoc() {
        return daDoc;
    }

    public void setDaDoc(Boolean daDoc) {
        this.daDoc = daDoc;
    }

    public LocalDateTime getThoiGianGui() {
        return thoiGianGui;
    }

    public void setThoiGianGui(LocalDateTime thoiGianGui) {
        this.thoiGianGui = thoiGianGui;
    }
}
