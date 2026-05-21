package com.ferromax.erp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RecepcionRequest(
        @NotNull
        Long productoId,

        @NotNull @Min(1)
        Integer cantidad,

        @Size(max = 500)
        String notas,

        // Opcional: vincula este movimiento a un remito
        Long recepcionRemitoId
) {}
