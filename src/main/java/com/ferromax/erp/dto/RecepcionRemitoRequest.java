package com.ferromax.erp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RecepcionRemitoRequest(

        @NotNull
        Long proveedorId,

        @NotBlank
        @Size(max = 100)
        String numeroRemito,

        @Size(max = 500)
        String notas
) {}