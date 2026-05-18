package com.facilitymanager.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Opaque-token: sinh {@code accessToken} = UUID (hex), lưu JSON {@link NoiDungPhien}
 * vào Redis dưới key {@code FM_USER_TOKEN:<token>}. Mỗi request, interceptor tra Redis
 * theo header {@code Authorization: Bearer <token>} (sliding TTL nếu không bật save-login).
 */
@Service
public class DichVuPhienToken {

    public static final String TOKEN_KEY_PREFIX = "FM_USER_TOKEN:";

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final long ttlMinutes;
    private final long saveLoginTtlDays;

    public DichVuPhienToken(
            StringRedisTemplate stringRedisTemplate,
            ObjectMapper objectMapper,
            @Value("${facility.token.ttl-minutes:120}") long ttlMinutes,
            @Value("${facility.token.save-login-ttl-days:30}") long saveLoginTtlDays
    ) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = objectMapper;
        this.ttlMinutes = Math.max(1, ttlMinutes);
        this.saveLoginTtlDays = Math.max(1, saveLoginTtlDays);
    }

    /** Cấp token mới, ghi {@link NoiDungPhien} vào Redis với TTL phù hợp. */
    public String phatHanhToken(NoiDungPhien payload) {
        String token = UUID.randomUUID().toString().replace("-", "");
        try {
            String json = objectMapper.writeValueAsString(payload);
            long ttl = payload.isSaveLogin() ? saveLoginTtlDays : ttlMinutes;
            TimeUnit unit = payload.isSaveLogin() ? TimeUnit.DAYS : TimeUnit.MINUTES;
            stringRedisTemplate.opsForValue().set(TOKEN_KEY_PREFIX + token, json, ttl, unit);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không serialize phiên đăng nhập.", ex);
        }
        return token;
    }

    /**
     * Tra Redis theo {@code Authorization: Bearer <token>}; trả {@link NoiDungPhien} hoặc {@code null}.
     * Nếu phiên không bật save-login thì gia hạn TTL (sliding) — chống logout sớm khi user còn hoạt động.
     */
    public NoiDungPhien giaiMa(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            return null;
        }
        String raw = authorization.startsWith("Bearer ")
                ? authorization.substring(7).trim()
                : authorization.trim();
        if (raw.isEmpty()) {
            return null;
        }
        String key = TOKEN_KEY_PREFIX + raw;
        String json = stringRedisTemplate.opsForValue().get(key);
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            NoiDungPhien payload = objectMapper.readValue(json, NoiDungPhien.class);
            if (!payload.isSaveLogin()) {
                stringRedisTemplate.expire(key, ttlMinutes, TimeUnit.MINUTES);
            }
            return payload;
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    /** Xóa phiên trong Redis (logout / kick). */
    public void thuHoi(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            return;
        }
        String raw = authorization.startsWith("Bearer ")
                ? authorization.substring(7).trim()
                : authorization.trim();
        if (!raw.isEmpty()) {
            stringRedisTemplate.delete(TOKEN_KEY_PREFIX + raw);
        }
    }
}
