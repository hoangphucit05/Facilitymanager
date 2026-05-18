package com.facilitymanager.exception;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.facilitymanager.dto.DuLieuLoiApi;

@RestControllerAdvice
public class XuLyNgoaiLeChung {

    private static final Logger nhatKy = LoggerFactory.getLogger(XuLyNgoaiLeChung.class);

    /**
     * Xử lý lỗi tham số / ràng buộc nghiệp vụ (HTTP 400).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<DuLieuLoiApi> xuLyThamSoKhongHopLe(IllegalArgumentException ngoaiLe, WebRequest yeuCau) {
        return taoPhanHoiLoi(HttpStatus.BAD_REQUEST, ngoaiLe.getMessage(), yeuCau);
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<java.util.Map<String, Object>> xuLyTrangThaiPhanHoi(
            org.springframework.web.server.ResponseStatusException ngoaiLe
    ) {
        HttpStatus status = HttpStatus.valueOf(ngoaiLe.getStatusCode().value());
        String msg = ngoaiLe.getReason() != null ? ngoaiLe.getReason() : status.getReasonPhrase();
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("success", false);
        body.put("message", msg);
        return ResponseEntity.status(status).body(body);
    }

    /**
     * Trình duyệt GET /favicon.ico mặc định; không có file tĩnh → không ghi ERROR toàn cục.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Void> xuLyKhongTimThayTaiNguyen(NoResourceFoundException ngoaiLe) {
        return ResponseEntity.notFound().build();
    }

    /**
     * Xử lý dự phòng cho mọi ngoại lệ chưa được bắt riêng (HTTP 500).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<DuLieuLoiApi> xuLyLoiChung(Exception ngoaiLe, WebRequest yeuCau) {
        nhatKy.error("Lỗi chưa xử lý", ngoaiLe);
        return taoPhanHoiLoi(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống", yeuCau);
    }

    /**
     * Dựng thân phản hồi lỗi thống nhất theo mã HTTP và thông điệp.
     */
    private static ResponseEntity<DuLieuLoiApi> taoPhanHoiLoi(HttpStatus trangThaiHttp, String thongDiep,
            WebRequest yeuCau) {
        String duongDan = "";
        if (yeuCau instanceof ServletWebRequest servletYeuCau) {
            duongDan = servletYeuCau.getRequest().getRequestURI();
        }
        DuLieuLoiApi than = new DuLieuLoiApi(
                Instant.now(),
                trangThaiHttp.value(),
                trangThaiHttp.getReasonPhrase(),
                thongDiep,
                duongDan);
        return ResponseEntity.status(trangThaiHttp).body(than);
    }
}
