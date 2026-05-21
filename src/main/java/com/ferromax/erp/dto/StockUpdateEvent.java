package com.ferromax.erp.dto;

public record StockUpdateEvent(
        Long productoId,
        String sku,
        Integer stockActual
) {}
