package com.facilitymanager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Boot 4 + {@code spring-boot-starter-webmvc} không luôn tạo sẵn bean {@link ObjectMapper};
 * {@link com.facilitymanager.security.DichVuPhienToken} và các chỗ serialize JSON cần bean này.
 */
@Configuration
public class CauHinhObjectMapper {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
