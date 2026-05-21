package com.ferromax.erp.dto;

import java.math.BigDecimal;

public record ItemVentaResponse(
        Long productoId,
        String sku,
        String nombreProducto,
        Integer cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal
) {}
