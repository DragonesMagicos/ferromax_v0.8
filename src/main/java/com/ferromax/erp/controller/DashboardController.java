package com.ferromax.erp.controller;

import com.ferromax.erp.dto.DashboardDTO;
import com.ferromax.erp.dto.VentaDiariaDTO;
import com.ferromax.erp.dto.VentaResponse;
import com.ferromax.erp.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    public ResponseEntity<DashboardDTO> resumen() {
        return ResponseEntity.ok(dashboardService.obtenerResumen());
    }

    @GetMapping("/ventas-semana")
    public ResponseEntity<List<VentaDiariaDTO>> ventasSemana() {
        return ResponseEntity.ok(dashboardService.ventasUltimos7Dias());
    }

    @GetMapping("/transacciones")
    public ResponseEntity<List<VentaResponse>> transacciones() {
        return ResponseEntity.ok(dashboardService.ultimasTransacciones(10));
    }
}
