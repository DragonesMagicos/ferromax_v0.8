package com.ferromax.erp.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductoUpdateRequest(
        @Size(max = 200)
        String nombre,

        @DecimalMin("0.00")
        BigDecimal precio,

        Integer stockMinimo,

        @Size(max = 500)
        String imagenUrl,

        @Size(max = 100)
        String codigoBarras
) {}
