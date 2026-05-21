package com.ferromax.erp.dto;

import java.time.OffsetDateTime;

public record RecepcionResponse(
        Long movimientoId,
        Long productoId,
        String sku,
        String nombreProducto,
        Integer cantidadRecibida,
        Integer stockAnterior,
        Integer stockNuevo,
        OffsetDateTime fecha
) {}
