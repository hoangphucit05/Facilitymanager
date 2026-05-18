package com.facilitymanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

/**
 * Cấu hình tài liệu OpenAPI (Swagger UI) cho API REST.
 */
@Configuration
public class CauHinhTaiLieuApi {

    /**
     * Đăng ký bean mô tả API (tiêu đề, phiên bản) hiển thị trên Swagger.
     *
     * @return đối tượng OpenAPI mặc định của dự án
     */
    @Bean
    public OpenAPI taiLieuApiMo() {
        return new OpenAPI()
                .info(new Info()
                        .title("Facility Manager API")
                        .description("REST API cho hệ thống quản lý cơ sở vật chất")
                        .version("1.0"));
    }
}
