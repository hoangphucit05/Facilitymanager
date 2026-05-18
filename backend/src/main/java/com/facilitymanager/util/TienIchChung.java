package com.facilitymanager.util;

import java.security.SecureRandom;
import java.util.Objects;
import java.util.UUID;

/**
 * Tiện ích dùng chung: đổi tên file upload, sinh mã ngẫu nhiên, kiểm tra danh sách id.
 */
public final class TienIchChung {

    private static final SecureRandom secureRandom = new SecureRandom();

    private TienIchChung() {
    }

    /** Sinh tên file ngẫu nhiên, giữ nguyên phần mở rộng. */
    public static String doiTenFileNgauNhien(String tenFileGoc) {
        if (TienIchChuoi.laRong(tenFileGoc)) {
            return UUID.randomUUID().toString().replace("-", "");
        }
        int viTriCham = tenFileGoc.lastIndexOf('.');
        String phanMoRong = viTriCham >= 0 ? tenFileGoc.substring(viTriCham) : "";
        return UUID.randomUUID().toString().replace("-", "") + phanMoRong;
    }

    /** Sinh mã 2 chữ số (00–99), dùng cho mã xác minh ngắn. */
    public static String sinhHaiChuSoNgauNhien() {
        int so = secureRandom.nextInt(100);
        return String.format("%02d", so);
    }

    /** Sinh mã 6 chữ số (000000–999999). */
    public static String sinhSauChuSoNgauNhien() {
        int so = secureRandom.nextInt(1_000_000);
        return String.format("%06d", so);
    }

    /**
     * Kiểm tra {@code idCanTim} có nằm trong {@code danhSachId} hay không.
     * Hữu ích khi tránh xóa vòng lặp trên cây (DFS) hoặc lọc id trùng.
     */
    public static boolean coTrongDanhSach(String idCanTim, String... danhSachId) {
        if (idCanTim == null || danhSachId == null) {
            return false;
        }
        for (String id : danhSachId) {
            if (Objects.equals(idCanTim, id)) {
                return true;
            }
        }
        return false;
    }
}
