package com.ferromax.erp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductoRapidoRequest(
        @NotBlank @Size(max = 100)
        String codigoBarras,

        String sku,

        @NotBlank @Size(max = 200)
        String nombre,

        String descripcion,

        String imagenUrl
) {}