package com.ferromax.erp.dto;

import com.ferromax.erp.model.EstadoRecepcionEnum;

import java.time.OffsetDateTime;
import java.util.List;

public record RecepcionRemitoResponse(
        Long id,
        Long proveedorId,
        String nombreProveedor,
        String numeroRemito,
        EstadoRecepcionEnum estado,
        String nombreEmpleado,
        String nombreAdmin,
        String notas,
        String notasAdmin,
        OffsetDateTime createdAt,
        OffsetDateTime confirmadoAt,
        List<ItemRecepcionResponse> items
) {
    public record ItemRecepcionResponse(
            Long movimientoId,
            Long productoId,
            String sku,
            String nombreProducto,
            Integer cantidad,
            Integer stockAnterior,
            Integer stockNuevo,
            OffsetDateTime fecha
    ) {}
}