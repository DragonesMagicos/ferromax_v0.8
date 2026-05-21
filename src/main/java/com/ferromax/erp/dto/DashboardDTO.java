package com.ferromax.erp.dto;

import java.math.BigDecimal;

public record DashboardDTO(
        BigDecimal ventasHoy,
        Integer cantidadVentasHoy,
        Integer productosStockCritico,
        Integer pedidosPendientes,
        BigDecimal saldoCaja
) {}
