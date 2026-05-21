package com.ferromax.erp.dto;

import java.math.BigDecimal;

public record ProductoPublicoDTO(
        Long id,
        String nombre,
        BigDecimal precio,
        Integer stockActual,
        String imagenUrl,
        String nombreCategoria
) {}
