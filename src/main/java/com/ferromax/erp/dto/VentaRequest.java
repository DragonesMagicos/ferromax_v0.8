package com.ferromax.erp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record VentaRequest(
        @NotBlank
        String medioPago,

        Long clienteId,

        @NotEmpty @Valid
        List<ItemVentaRequest> items
) {}
