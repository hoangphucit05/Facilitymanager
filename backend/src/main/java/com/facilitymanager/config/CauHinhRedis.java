package com.facilitymanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Cấu hình Redis: {@link StringRedisTemplate} dùng cho captcha & opaque token.
 * Server cần Redis chạy ở {@code spring.data.redis.host:port}.
 */
@Configuration
public class CauHinhRedis {

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }
}
