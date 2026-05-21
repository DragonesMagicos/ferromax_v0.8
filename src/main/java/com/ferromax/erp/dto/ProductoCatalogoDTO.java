package com.ferromax.erp.dto;

import java.math.BigDecimal;

public record ProductoCatalogoDTO(
        Long id,
        String sku,
        String nombre,
        String marca,
        BigDecimal precio,
        Integer stockActual,
        String disponibilidad,
        String imagenUrl,
        String nombreCategoria,
        String subcategoria
) {}
