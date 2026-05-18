package com.facilitymanager.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Objects;

/**
 * Lấy IP thật từ request (proxy / load balancer) và tra vị trí địa lý (API Tencent Map — tùy chọn).
 */
@Component
public class TienIchDiaChiIp {

    private static final Logger nhatKy = LoggerFactory.getLogger(TienIchDiaChiIp.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final String HEADER_X_FORWARDED = "x-forwarded-for";
    private static final String HEADER_PROXY_CLIENT = "Proxy-Client-IP";
    private static final String HEADER_WL_PROXY = "WL-Proxy-Client-IP";
    private static final String KHONG_XAC_DINH = "unknown";
    private static final String LOCALHOST_IPV4 = "127.0.0.1";
    private static final String LOCALHOST_IPV6 = "0:0:0:0:0:0:0:1";

    private final String khoaBanDoTencent;
    private final HttpClient httpClient;

    public TienIchDiaChiIp(
            @Value("${facility.ip.tencent-map-key:}") String khoaBanDoTencent
    ) {
        this.khoaBanDoTencent = khoaBanDoTencent != null ? khoaBanDoTencent.trim() : "";
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    /** Địa chỉ IP từ header hoặc {@code getRemoteAddr()}. */
    public String layIpTuRequest(HttpServletRequest request) {
        String ip = request.getHeader(HEADER_X_FORWARDED);
        if (laIpKhongHopLe(ip)) {
            ip = request.getHeader(HEADER_PROXY_CLIENT);
        }
        if (laIpKhongHopLe(ip)) {
            ip = request.getHeader(HEADER_WL_PROXY);
        }
        if (laIpKhongHopLe(ip)) {
            ip = request.getRemoteAddr();
            if (Objects.equals(LOCALHOST_IPV4, ip)) {
                try {
                    ip = InetAddress.getLocalHost().getHostAddress();
                } catch (UnknownHostException ex) {
                    nhatKy.debug("Không lấy được host local: {}", ex.getMessage());
                }
            }
        }
        if (ip != null && ip.length() > 15 && ip.contains(",")) {
            ip = ip.substring(0, ip.indexOf(',')).trim();
        }
        if (Objects.equals(LOCALHOST_IPV6, ip)) {
            ip = LOCALHOST_IPV4;
        }
        return ip != null ? ip : "";
    }

    /**
     * Tra quận/huyện theo IP (Tencent). Nếu không cấu hình key hoặc lỗi mạng → trả mô tả mặc định.
     */
    public String layKhuVucTheoIp(HttpServletRequest request) {
        if (TienIchChuoi.laRong(khoaBanDoTencent)) {
            return "Chưa cấu hình khóa bản đồ";
        }
        String ip = layIpTuRequest(request);
        if (TienIchChuoi.laRong(ip) || LOCALHOST_IPV4.equals(ip)) {
            return "Môi trường cục bộ";
        }
        String url = "https://apis.map.qq.com/ws/location/v1/ip?key="
                + khoaBanDoTencent + "&ip=" + ip;
        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            HttpResponse<String> phanHoi = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            JsonNode goc = objectMapper.readTree(phanHoi.body());
            if (!"0".equals(goc.path("status").asText())) {
                return "Không tra được vị trí";
            }
            JsonNode adInfo = goc.path("result").path("ad_info");
            String quocGia = adInfo.path("nation").asText("");
            String tinh = adInfo.path("province").asText("");
            String thanhPho = adInfo.path("city").asText("");
            String quan = adInfo.path("district").asText("");
            if (TienIchChuoi.khongRong(quocGia) && TienIchChuoi.laRong(tinh)) {
                return quocGia;
            }
            StringBuilder sb = new StringBuilder(tinh);
            if (TienIchChuoi.khongRong(thanhPho)) {
                sb.append('-').append(thanhPho);
            }
            if (TienIchChuoi.khongRong(quan)) {
                sb.append('-').append(quan);
            }
            return sb.toString();
        } catch (Exception ex) {
            nhatKy.warn("Tra cứu vị trí IP thất bại: {}", ex.getMessage());
            return "Không tra được vị trí";
        }
    }

    private static boolean laIpKhongHopLe(String ip) {
        return ip == null || ip.isBlank() || KHONG_XAC_DINH.equalsIgnoreCase(ip);
    }
}
