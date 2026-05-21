package com.ferromax.erp.dto;

public record UsuarioDTO(
        Long id,
        String nombre,
        String apellido,
        String email,
        String rol
) {}
