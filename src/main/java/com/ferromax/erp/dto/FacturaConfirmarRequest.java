package com.ferromax.erp.dto;

import java.util.List;

public record FacturaConfirmarRequest(
        List<ItemConfirmarDTO> items,
        String notas,
        Long facturaId,
        String proveedor,
        String nroFactura
) {}
