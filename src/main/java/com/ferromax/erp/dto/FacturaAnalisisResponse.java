package com.ferromax.erp.dto;

import java.util.List;

public record FacturaAnalisisResponse(
        String proveedor,
        String cuitProveedor,
        Long proveedorId,
        String numeroFactura,
        List<ItemFacturaDTO> items,
        Long facturaId
) {}
