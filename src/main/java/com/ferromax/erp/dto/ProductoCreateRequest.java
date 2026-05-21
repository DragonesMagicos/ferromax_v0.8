package com.ferromax.erp.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductoCreateRequest(
        @NotBlank @Size(max = 50)
        String sku,

        @Size(max = 100)
        String codigoBarras,

        @NotBlank @Size(max = 200)
        String nombre,

        String descripcion,

        @NotNull @DecimalMin("0.00")
        BigDecimal precio,

        BigDecimal precioCompra,

        Integer stockMinimo,

        String imagenUrl,

        Long categoriaId,

        Long proveedorId
) {}
