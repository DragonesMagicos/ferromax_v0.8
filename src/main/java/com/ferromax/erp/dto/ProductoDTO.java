package com.ferromax.erp.dto;

import java.math.BigDecimal;

public record ProductoDTO(
        Long id,
        String sku,
        String codigoBarras,
        String nombre,
        String descripcion,
        BigDecimal precio,
        Integer stockActual,
        Integer stockMinimo,
        Boolean activo,
        String imagenUrl,
        String nombreCategoria,
        String nombreProveedor
) {}
