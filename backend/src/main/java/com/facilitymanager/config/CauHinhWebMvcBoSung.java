package com.facilitymanager.config;

import com.facilitymanager.security.BoLocPhienToken;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CauHinhWebMvcBoSung implements WebMvcConfigurer {

    private final BoLocPhienToken boLocPhienToken;

    public CauHinhWebMvcBoSung(BoLocPhienToken boLocPhienToken) {
        this.boLocPhienToken = boLocPhienToken;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(boLocPhienToken)
                .addPathPatterns("/api/admin/**", "/api/permission/getMenuList", "/api/requests/**", "/api/audits/**");
    }
}
