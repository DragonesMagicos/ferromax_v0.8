package com.ferromax.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class FerromaxErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(FerromaxErpApplication.class, args);
    }
}
