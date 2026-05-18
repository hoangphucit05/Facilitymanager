package com.facilitymanager.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;

/**
 * Interceptor đọc {@code Authorization: Bearer <uuid>} → tra Redis qua {@link DichVuPhienToken}.
 * Mỗi request đều phải tra Redis (opaque token). Chặn /api/admin/** với role khác ADMIN.
 */
@Component
public class BoLocPhienToken implements HandlerInterceptor {

    public static final String ATTR_USERNAME = "FM_AUTH_USERNAME";
    public static final String ATTR_USER_ID = "FM_AUTH_USER_ID";
    public static final String ATTR_ROLE = "FM_AUTH_ROLE";
    public static final String ATTR_PAYLOAD = "FM_AUTH_PAYLOAD";

    private final DichVuPhienToken dichVuPhienToken;

    public BoLocPhienToken(DichVuPhienToken dichVuPhienToken) {
        this.dichVuPhienToken = dichVuPhienToken;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String uri = request.getRequestURI();
        if (!canBatBuoc(uri)) {
            return true;
        }
        String auth = request.getHeader("Authorization");
        NoiDungPhien payload = dichVuPhienToken.giaiMa(auth);
        if (payload == null) {
            viet401(response, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
            return false;
        }
        request.setAttribute(ATTR_USERNAME, payload.getUsername());
        request.setAttribute(ATTR_USER_ID, payload.getUserId());
        request.setAttribute(ATTR_ROLE, payload.getRoleCode());
        request.setAttribute(ATTR_PAYLOAD, payload);

        if (uri.startsWith("/api/admin")) {
            String role = payload.getRoleCode();
            if (role == null || !"ADMIN".equalsIgnoreCase(role)) {
                viet403(response, "Chỉ quản trị viên mới được thực hiện thao tác này.");
                return false;
            }
        }
        return true;
    }

    private static boolean canBatBuoc(String uri) {
        return uri.startsWith("/api/admin") || uri.contains("/api/permission/getMenuList");
    }

    private static void viet401(HttpServletResponse response, String message) throws Exception {
        response.setStatus(401);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"success\":false,\"message\":\"" + escapeJson(message) + "\"}");
    }

    private static void viet403(HttpServletResponse response, String message) throws Exception {
        response.setStatus(403);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"success\":false,\"message\":\"" + escapeJson(message) + "\"}");
    }

    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
