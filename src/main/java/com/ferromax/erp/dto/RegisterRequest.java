package com.ferromax.erp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 100)
        String nombre,

        @Size(max = 100)
        String apellido,

        @NotBlank @Email @Size(max = 150)
        String email,

        @NotBlank @Size(min = 6)
        String password
) {}
