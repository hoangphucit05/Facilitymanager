package com.facilitymanager.enums;

/**
 * Phân loại thông báo hệ thống gửi tới người dùng.
 */
public enum LoaiThongBaoHeThong {
    /** Cảnh báo mức tồn kho */
    CANH_BAO_TON_KHO,
    /** Nhắc lịch bảo trì đến hạn */
    BAO_TRI_DEN_HAN,
    /** Sự cố thiết bị */
    SU_CO_THIET_BI,
    /** Thông báo hoàn thành công việc */
    HOAN_THANH_CONG_VIEC,
    /** Thông báo chung */
    THONG_BAO_CHUNG,
    /** Nhắc kiểm kê định kỳ */
    KIEM_KE_DINH_KY
}
