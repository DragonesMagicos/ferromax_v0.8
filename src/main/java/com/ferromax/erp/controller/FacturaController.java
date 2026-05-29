package com.ferromax.erp.controller;

import com.ferromax.erp.dto.*;
import com.ferromax.erp.security.JwtTokenProvider;
import com.ferromax.erp.service.FacturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/facturas")
@RequiredArgsConstructor
public class FacturaController {

    private final FacturaService facturaService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping(value = "/analizar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacturaAnalisisResponse> analizarFactura(
            @RequestPart("archivo") MultipartFile archivo,
            @RequestHeader("Authorization") String authHeader) {

        Long usuarioId = jwtTokenProvider.obtenerUsuarioIdDesdeToken(authHeader.substring(7));
        return ResponseEntity.ok(facturaService.analizarFactura(archivo, usuarioId));
    }

    @PostMapping("/confirmar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RecepcionResponse>> confirmarIngreso(
            @RequestBody FacturaConfirmarRequest request,
            @RequestHeader("Authorization") String authHeader) {

        Long usuarioId = jwtTokenProvider.obtenerUsuarioIdDesdeToken(authHeader.substring(7));
        return ResponseEntity.ok(facturaService.confirmarIngreso(request, usuarioId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<FacturaIngresoResumenDTO> resultado = facturaService.listar(page, size)
                .map(FacturaIngresoResumenDTO::from);

        return ResponseEntity.ok(Map.of(
                "content", resultado.getContent(),
                "totalElements", resultado.getTotalElements(),
                "totalPages", resultado.getTotalPages(),
                "page", resultado.getNumber()
        ));
    }
}
