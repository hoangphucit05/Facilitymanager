package com.facilitymanager.util;

/**
 * Tiện ích kiểm tra chuỗi rỗng / null — dùng chung cho các lớp util khác.
 */
public final class TienIchChuoi {

    private TienIchChuoi() {
    }

    public static boolean laRong(String giaTri) {
        return giaTri == null || giaTri.isBlank();
    }

    public static boolean khongRong(String giaTri) {
        return !laRong(giaTri);
    }
}
