package com.ferromax.erp.controller;

import com.ferromax.erp.dto.AlertaStockDTO;
import com.ferromax.erp.service.AlertaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/alertas")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AlertaController {

    private final AlertaService alertaService;

    @GetMapping
    public ResponseEntity<List<AlertaStockDTO>> noLeidas() {
        return ResponseEntity.ok(alertaService.listarNoLeidas());
    }

    @GetMapping("/todas")
    public ResponseEntity<List<AlertaStockDTO>> todas() {
        return ResponseEntity.ok(alertaService.listarUltimos30Dias());
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<AlertaStockDTO> marcarLeida(@PathVariable Long id) {
        return ResponseEntity.ok(alertaService.marcarLeida(id));
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<Map<String, Integer>> marcarTodasLeidas() {
        return ResponseEntity.ok(alertaService.marcarTodasLeidas());
    }
}
