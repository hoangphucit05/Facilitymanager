package com.facilitymanager.controller;

import com.facilitymanager.captcha.DichVuCaptchaRedis;
import com.facilitymanager.captcha.TaoMaXacMinh;
import com.facilitymanager.dto.KetQuaApi;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API CAPTCHA — UUID + Redis: client gọi /init để lấy {@code captchaId},
 * gọi /draw/{captchaId} để lấy ảnh PNG; mỗi lần xác thực backend đều tra Redis.
 */
@RestController
@RequestMapping("/api/common/captcha")
@CrossOrigin(origins = "*")
public class DieuKhienCaptcha {

    private final DichVuCaptchaRedis dichVuCaptchaRedis;
    private final TaoMaXacMinh taoMaXacMinh = new TaoMaXacMinh();

    public DieuKhienCaptcha(DichVuCaptchaRedis dichVuCaptchaRedis) {
        this.dichVuCaptchaRedis = dichVuCaptchaRedis;
    }

    @GetMapping("/init")
    public KetQuaApi<String> init() {
        return KetQuaApi.ok(dichVuCaptchaRedis.taoCaptchaIdVaLuuMa());
    }

    @GetMapping("/draw/{captchaId}")
    public ResponseEntity<byte[]> draw(@PathVariable String captchaId) {
        String code = dichVuCaptchaRedis.layMaHoacNull(captchaId);
        if (code == null) {
            return ResponseEntity.notFound().build();
        }
        byte[] png = taoMaXacMinh.writePng(code);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .contentType(MediaType.IMAGE_PNG)
                .body(png);
    }
}
