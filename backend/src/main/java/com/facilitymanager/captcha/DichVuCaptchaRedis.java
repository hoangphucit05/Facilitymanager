package com.facilitymanager.captcha;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * CAPTCHA opaque-token theo mô hình {@code UUID + Redis}: sinh {@code captchaId} (UUID),
 * lưu mã 4 chữ số trong Redis với TTL ngắn — mỗi yêu cầu xác minh sẽ tra Redis theo key.
 */
@Service
public class DichVuCaptchaRedis {

    public static final String CAPTCHA_KEY_PREFIX = "FM_CAPTCHA:";

    private static final int CODE_LEN = 4;

    private final StringRedisTemplate stringRedisTemplate;
    private final Duration ttl;

    public DichVuCaptchaRedis(
            StringRedisTemplate stringRedisTemplate,
            @Value("${facility.captcha.ttl-minutes:2}") long ttlMinutes
    ) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.ttl = Duration.ofMinutes(Math.max(1, ttlMinutes));
    }

    /** Tạo {@code captchaId} (UUID không dấu), lưu code 4 chữ số vào Redis với TTL. */
    public String taoCaptchaIdVaLuuMa() {
        String id = UUID.randomUUID().toString().replace("-", "");
        String code = sinhChuoiSo(CODE_LEN);
        stringRedisTemplate.opsForValue().set(CAPTCHA_KEY_PREFIX + id, code, ttl);
        return id;
    }

    /** Đọc mã captcha từ Redis theo {@code captchaId}; không có / hết hạn → {@code null}. */
    public String layMaHoacNull(String captchaId) {
        if (captchaId == null || captchaId.isBlank()) {
            return null;
        }
        return stringRedisTemplate.opsForValue().get(CAPTCHA_KEY_PREFIX + captchaId);
    }

    /** Xóa key captcha (sau khi đã xác minh đúng — captcha một-lần). */
    public void xoa(String captchaId) {
        if (captchaId != null && !captchaId.isBlank()) {
            stringRedisTemplate.delete(CAPTCHA_KEY_PREFIX + captchaId);
        }
    }

    /**
     * Tra Redis xem mã có khớp không; nếu khớp thì xóa luôn (captcha một-lần dùng).
     */
    public boolean xacThucVaXoa(String captchaId, String userInput) {
        if (captchaId == null || captchaId.isBlank() || userInput == null || userInput.isBlank()) {
            return false;
        }
        String mongDoi = layMaHoacNull(captchaId);
        if (mongDoi == null) {
            return false;
        }
        boolean ok = mongDoi.equalsIgnoreCase(userInput.trim());
        if (ok) {
            xoa(captchaId);
        }
        return ok;
    }

    private static String sinhChuoiSo(int do_dai) {
        StringBuilder sb = new StringBuilder(do_dai);
        ThreadLocalRandom r = ThreadLocalRandom.current();
        for (int i = 0; i < do_dai; i++) {
            sb.append(r.nextInt(10));
        }
        return sb.toString();
    }
}
