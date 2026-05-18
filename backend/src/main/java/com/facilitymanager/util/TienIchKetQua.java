package com.facilitymanager.util;

import com.facilitymanager.dto.KetQuaApi;

/**
 * Bọc {@link KetQuaApi} — tương đương ResultUtil, chưa gắn vào controller.
 */
public final class TienIchKetQua {

    private static final String THONG_DIEP_THANH_CONG_MAC_DINH = "Thành công";
    private static final String THONG_DIEP_THAT_BAI_MAC_DINH = "Thao tác thất bại";

    private TienIchKetQua() {
    }

    public static <T> KetQuaApi<T> thanhCong(T duLieu) {
        return KetQuaApi.ok(duLieu);
    }

    public static <T> KetQuaApi<T> thanhCong(T duLieu, String thongDiep) {
        KetQuaApi<T> ketQua = new KetQuaApi<>(true, duLieu, thongDiep);
        return ketQua;
    }

    public static KetQuaApi<Void> thanhCongKhongDuLieu() {
        return thanhCong(null, THONG_DIEP_THANH_CONG_MAC_DINH);
    }

    public static KetQuaApi<Void> thanhCongKhongDuLieu(String thongDiep) {
        return thanhCong(null, thongDiep);
    }

    public static <T> KetQuaApi<T> thatBai(String thongDiep) {
        return KetQuaApi.fail(thongDiep);
    }

    public static <T> KetQuaApi<T> thatBai() {
        return KetQuaApi.fail(THONG_DIEP_THAT_BAI_MAC_DINH);
    }
}
