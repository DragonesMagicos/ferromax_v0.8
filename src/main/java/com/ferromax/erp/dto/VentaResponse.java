package com.ferromax.erp.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record VentaResponse(
        Long id,
        OffsetDateTime fecha,
        BigDecimal total,
        String estado,
        String medioPago,
        String nombreCajero,
        Integer cantidadItems,
        String origen
) {}
