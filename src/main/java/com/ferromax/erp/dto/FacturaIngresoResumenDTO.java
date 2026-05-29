package com.ferromax.erp.dto;

import com.ferromax.erp.model.EstadoFacturaEnum;
import com.ferromax.erp.model.FacturaIngreso;

import java.time.OffsetDateTime;

public record FacturaIngresoResumenDTO(
        Long id,
        String numeroFactura,
        String proveedorNombre,
        String archivoNombre,
        EstadoFacturaEnum estado,
        String notas,
        int cantidadItems,
        OffsetDateTime createdAt,
        OffsetDateTime confirmadoAt
) {
    public static FacturaIngresoResumenDTO from(FacturaIngreso f) {
        return new FacturaIngresoResumenDTO(
                f.getId(),
                f.getNumeroFactura(),
                f.getProveedorNombre(),
                f.getArchivoNombre(),
                f.getEstado(),
                f.getNotas(),
                f.getItems().size(),
                f.getCreatedAt(),
                f.getConfirmadoAt()
        );
    }
}
