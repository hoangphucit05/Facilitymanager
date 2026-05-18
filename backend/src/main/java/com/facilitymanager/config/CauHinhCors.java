package com.facilitymanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Cấu hình CORS toàn cục — cho phép frontend (file://, localhost bất kỳ cổng)
 * và SQL Sync Server (8081) gọi vào backend mà không bị trình duyệt chặn.
 */
@Configuration
public class CauHinhCors {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");          // mọi origin
        config.addAllowedMethod("*");                 // GET, POST, PUT, PATCH, DELETE, OPTIONS
        config.addAllowedHeader("*");                 // mọi header
        config.setAllowCredentials(false);            // không cần cookie
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
