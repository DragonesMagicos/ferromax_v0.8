package com.ferromax.erp.dto;

import java.time.OffsetDateTime;

public record AlertaStockDTO(
        Long id,
        String nombreProducto,
        Integer stockActual,
        Integer stockMinimo,
        String tipoAlerta,
        OffsetDateTime fechaGeneracion,
        Boolean lida
) {}
