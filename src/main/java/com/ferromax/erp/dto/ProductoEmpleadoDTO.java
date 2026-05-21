package com.ferromax.erp.dto;

import java.math.BigDecimal;

public record ProductoEmpleadoDTO(
        Long id,
        String sku,
        String codigoBarras,
        String nombre,
        String descripcion,
        BigDecimal precio,
        Integer stockActual,
        Integer stockMinimo,
        String imagenUrl,
        String nombreCategoria
) {}
