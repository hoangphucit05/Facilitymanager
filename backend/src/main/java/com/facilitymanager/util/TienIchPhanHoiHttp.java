package com.facilitymanager.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Ghi JSON trực tiếp ra {@link HttpServletResponse} — dùng trong filter / interceptor
 * khi chưa qua {@link org.springframework.http.ResponseEntity}.
 */
public final class TienIchPhanHoiHttp {

    private static final Logger nhatKy = LoggerFactory.getLogger(TienIchPhanHoiHttp.class);
    private static final String MA_HOA_KY_TU = StandardCharsets.UTF_8.name();
    private static final String LOAI_NOI_DUNG = "application/json;charset=UTF-8";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private TienIchPhanHoiHttp() {
    }

    public static void ghiJson(HttpServletResponse phanHoi, Map<String, Object> noiDung) {
        phanHoi.setCharacterEncoding(MA_HOA_KY_TU);
        phanHoi.setContentType(LOAI_NOI_DUNG);
        try (ServletOutputStream luong = phanHoi.getOutputStream()) {
            luong.write(objectMapper.writeValueAsBytes(noiDung));
            luong.flush();
        } catch (IOException ex) {
            nhatKy.warn("Không ghi được JSON ra response: {}", ex.getMessage());
        }
    }

    public static Map<String, Object> taoMapPhanHoi(
            boolean thanhCong,
            int maTrangThai,
            String thongDiep,
            Object duLieu
    ) {
        Map<String, Object> map = new HashMap<>(8);
        map.put("success", thanhCong);
        map.put("code", maTrangThai);
        map.put("message", thongDiep);
        map.put("result", duLieu);
        map.put("timestamp", System.currentTimeMillis() / 1000L);
        return map;
    }

    public static Map<String, Object> thanhCong(String thongDiep) {
        return taoMapPhanHoi(true, 200, thongDiep, null);
    }

    public static Map<String, Object> thanhCong() {
        return thanhCong("Thao tác thành công");
    }

    public static Map<String, Object> thatBai(int maTrangThai, String thongDiep) {
        return taoMapPhanHoi(false, maTrangThai, thongDiep, null);
    }
}
