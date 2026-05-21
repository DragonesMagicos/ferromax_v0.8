package com.ferromax.erp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Sirve ./img/** desde el filesystem del proyecto.
        // Accesible en /api/img/** (context-path=/api) → el proxy de Vite
        // reenvía /api/img/... a http://localhost:8081/api/img/...
        registry.addResourceHandler("/img/**")
                .addResourceLocations("file:./img/");
    }
}
