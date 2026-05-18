package com.facilitymanager.service;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class DichVuChuanHoaMaVaiTro {

    /**
     * Chuẩn hóa cột users.role (có thể là ADMIN, MANAGER, hoặc tiêu đề tiếng Việt) → mã dùng cho RBAC.
     */
    public String chuanHoa(String roleTuBangUser) {
        if (roleTuBangUser == null || roleTuBangUser.isBlank()) {
            return "STAFF";
        }
        String t = roleTuBangUser.trim();
        String u = t.toUpperCase(Locale.ROOT);
        if ("ADMIN".equals(u)) {
            return "ADMIN";
        }
        if ("MANAGER".equals(u)) {
            return "MANAGER";
        }
        if ("STAFF".equals(u)) {
            return "STAFF";
        }
        if ("STUDENT".equals(u)) {
            return "STUDENT";
        }
        String lower = t.toLowerCase(Locale.ROOT);
        if (lower.contains("hiệu") || lower.contains("hieu") || lower.contains("trưởng") || lower.contains("truong")) {
            return "MANAGER";
        }
        return "STAFF";
    }
}
