package com.ferromax.erp.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConfirmarRemitoRequest(

        @NotNull
        Boolean aprobar,   // true = CONFIRMADO, false = RECHAZADO

        @Size(max = 500)
        String notasAdmin
) {}