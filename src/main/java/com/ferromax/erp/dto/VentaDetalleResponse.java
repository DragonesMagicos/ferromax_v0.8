package com.ferromax.erp.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record VentaDetalleResponse(
        Long id,
        OffsetDateTime fecha,
        BigDecimal subtotal,
        BigDecimal descuento,
        BigDecimal total,
        String estado,
        String medioPago,
        String nombreCajero,
        String origen,
        Long comprobanteId,
        List<ItemVentaResponse> items
) {}
