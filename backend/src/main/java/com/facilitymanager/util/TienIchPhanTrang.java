package com.facilitymanager.util;

import com.facilitymanager.vo.YeuCauPhanTrang;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Phân trang JPA và phân trang thủ công trên {@link List}; chống SQL injection trên tên cột sắp xếp.
 */
public final class TienIchPhanTrang {

    private static final String[] TU_KHOA_CAM = {
            "drop", "select", "master", "insert", "truncate", "declare",
            "delete", "sleep", "update", "alter"
    };

    private static final String THU_TU_TANG = "asc";
    private static final String THU_TU_GIAM = "desc";
    private static final String GACH_DUOI = "_";
    private static final int SO_TRANG_TOI_THIEU = 1;
    private static final int KICH_THUOC_TOI_THIEU = 1;
    private static final int KICH_THUOC_TOI_DA = 100;

    private TienIchPhanTrang() {
    }

    /** Chuyển {@link YeuCauPhanTrang} sang {@link Pageable} cho Spring Data JPA. */
    public static Pageable taoPageable(YeuCauPhanTrang yeuCau) {
        int soTrang = chuanHoaSoTrang(yeuCau.getSoTrang());
        int kichThuoc = chuanHoaKichThuoc(yeuCau.getKichThuocTrang());
        String cotSapXep = yeuCau.getCotSapXep();
        String thuTu = yeuCau.getThuTu();

        if (TienIchChuoi.khongRong(cotSapXep)) {
            chanSqlInjection(cotSapXep);
            Sort.Direction huong = TienIchChuoi.laRong(thuTu)
                    ? Sort.Direction.DESC
                    : Sort.Direction.valueOf(thuTu.trim().toUpperCase());
            Sort sort = Sort.by(huong, camelSangSnake(cotSapXep));
            return PageRequest.of(soTrang - 1, kichThuoc, sort);
        }
        return PageRequest.of(soTrang - 1, kichThuoc);
    }

    /** Cắt một {@link List} trong bộ nhớ theo trang (không qua DB). */
    public static <T> List<T> catDanhSachTheoTrang(YeuCauPhanTrang yeuCau, List<T> danhSach) {
        if (danhSach == null || danhSach.isEmpty()) {
            return List.of();
        }
        int soTrang = chuanHoaSoTrang(yeuCau.getSoTrang());
        int kichThuoc = chuanHoaKichThuoc(yeuCau.getKichThuocTrang());
        int chiSoBatDau = (soTrang - 1) * kichThuoc;
        if (chiSoBatDau >= danhSach.size()) {
            return new ArrayList<>();
        }
        int chiSoKetThuc = Math.min(chiSoBatDau + kichThuoc, danhSach.size());
        return danhSach.subList(chiSoBatDau, chiSoKetThuc);
    }

    /** Chặn từ khóa SQL trong tên cột sắp xếp. */
    public static void chanSqlInjection(String cotSapXep) {
        if (TienIchChuoi.laRong(cotSapXep)) {
            return;
        }
        String chuoiThuong = cotSapXep.toLowerCase();
        for (String tuCam : TU_KHOA_CAM) {
            if (chuoiThuong.contains(tuCam)) {
                throw new IllegalArgumentException("Cột sắp xếp không hợp lệ: " + cotSapXep);
            }
        }
    }

    /** camelCase → snake_case (ví dụ: createdAt → created_at). */
    public static String camelSangSnake(String camel) {
        if (TienIchChuoi.laRong(camel)) {
            return "";
        }
        if (camel.length() < 2) {
            return camel.toLowerCase();
        }
        StringBuilder buf = new StringBuilder();
        for (int i = 1; i < camel.length(); i++) {
            char c = camel.charAt(i);
            if (Character.isUpperCase(c)) {
                buf.append(GACH_DUOI).append(Character.toLowerCase(c));
            } else {
                buf.append(c);
            }
        }
        return (camel.charAt(0) + buf.toString()).toLowerCase();
    }

    private static int chuanHoaSoTrang(int soTrang) {
        return soTrang < SO_TRANG_TOI_THIEU ? SO_TRANG_TOI_THIEU : soTrang;
    }

    private static int chuanHoaKichThuoc(int kichThuoc) {
        if (kichThuoc < KICH_THUOC_TOI_THIEU) {
            return KICH_THUOC_TOI_THIEU;
        }
        return Math.min(kichThuoc, KICH_THUOC_TOI_DA);
    }

    /** Kiểm tra thứ tự sắp xếp có phải asc hay không (mặc định desc nếu không rõ). */
    public static boolean laThuTuTang(String thuTu) {
        return Objects.equals(thuTu != null ? thuTu.trim().toLowerCase() : null, THU_TU_TANG);
    }

    public static boolean laThuTuGiam(String thuTu) {
        return Objects.equals(thuTu != null ? thuTu.trim().toLowerCase() : null, THU_TU_GIAM);
    }
}
