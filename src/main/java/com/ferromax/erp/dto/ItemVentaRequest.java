package com.ferromax.erp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ItemVentaRequest(
        @NotNull
        Long productoId,

        @NotNull @Min(1)
        Integer cantidad
) {}
