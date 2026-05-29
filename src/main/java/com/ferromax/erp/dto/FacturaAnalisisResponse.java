package com.ferromax.erp.dto;

import java.util.List;

public record FacturaAnalisisResponse(
        String proveedor,
        String numeroFactura,
        List<ItemFacturaDTO> items,
        Long facturaId
) {}
