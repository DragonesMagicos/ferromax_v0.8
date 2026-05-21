package com.ferromax.erp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AjusteStockRequest(

        @NotNull
        Long productoId,

        // Positivo = entrada, negativo = salida
        @NotNull
        Integer cantidad,

        @NotBlank @Size(max = 500)
        String motivo
) {}
