package com.ferromax.erp.dto;

import java.time.OffsetDateTime;

public record AjusteStockResponse(
        Long movimientoId,
        Long productoId,
        String sku,
        String nombreProducto,
        Integer cantidad,
        Integer stockAnterior,
        Integer stockNuevo,
        String motivo,
        String nombreAdmin,
        OffsetDateTime fecha
) {}
