package com.ferromax.erp.dto;

public record ItemConfirmarDTO(
        Long productoId,
        String codigoSku,
        Integer cantidad,
        Double precioUnitario
) {}
