package com.ferromax.erp.dto;

public record ItemFacturaDTO(
        String descripcion,
        String codigoSku,
        Integer cantidad,
        Double precioUnitario,
        Long productoId,
        String productoNombre
) {}
