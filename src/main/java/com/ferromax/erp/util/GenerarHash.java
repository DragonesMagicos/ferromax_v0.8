package com.ferromax.erp.util;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class GenerarHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        System.out.println("ADMIN_HASH=" + enc.encode("admin123"));
        System.out.println("EMPL_HASH=" + enc.encode("empleado123"));
    }
}
