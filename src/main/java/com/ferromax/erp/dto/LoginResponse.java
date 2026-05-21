package com.ferromax.erp.dto;

public record LoginResponse(
        String token,
        String rol,
        String nombre,
        String mensaje
) {}
