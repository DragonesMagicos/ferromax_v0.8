package com.ferromax.erp.controller;

import com.ferromax.erp.dto.ConfirmarRemitoRequest;
import com.ferromax.erp.dto.RecepcionRemitoRequest;
import com.ferromax.erp.dto.RecepcionRemitoResponse;
import com.ferromax.erp.security.JwtTokenProvider;
import com.ferromax.erp.service.RecepcionRemitoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recepciones-remito")
@RequiredArgsConstructor
public class RecepcionRemitoController {

    private final RecepcionRemitoService service;
    private final JwtTokenProvider jwtTokenProvider;

    // ── EMPLEADO: crear encabezado de remito ──────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    public ResponseEntity<RecepcionRemitoResponse> crear(
            @Valid @RequestBody RecepcionRemitoRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long empleadoId = jwtTokenProvider.obtenerUsuarioIdDesdeToken(authHeader.substring(7));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.crearRemito(request, empleadoId));
    }

    // ── EMPLEADO: ver sus propios remitos ─────────────────────────────────────

    @GetMapping("/mis-recepciones")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    public ResponseEntity<List<RecepcionRemitoResponse>> misRecepciones(
            @RequestHeader("Authorization") String authHeader) {
        Long empleadoId = jwtTokenProvider.obtenerUsuarioIdDesdeToken(authHeader.substring(7));
        return ResponseEntity.ok(service.listarMisRemitos(empleadoId));
    }

    // ── ADMIN: listar pendientes ───────────────────────────────────────────────

    @GetMapping("/pendientes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RecepcionRemitoResponse>> pendientes() {
        return ResponseEntity.ok(service.listarPendientes());
    }

    // ── ADMIN: listar todos ────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RecepcionRemitoResponse>> todos() {
        return ResponseEntity.ok(service.listarTodos());
    }

    // ── ADMIN + EMPLEADO: ver detalle de un remito ────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    public ResponseEntity<RecepcionRemitoResponse> detalle(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtenerDetalle(id));
    }

    // ── ADMIN: confirmar o rechazar ───────────────────────────────────────────

    @PatchMapping("/{id}/confirmar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RecepcionRemitoResponse> confirmar(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmarRemitoRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long adminId = jwtTokenProvider.obtenerUsuarioIdDesdeToken(authHeader.substring(7));
        return ResponseEntity.ok(service.confirmar(id, request, adminId));
    }
}
