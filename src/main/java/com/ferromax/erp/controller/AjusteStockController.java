package com.ferromax.erp.controller;

import com.ferromax.erp.dto.AjusteStockRequest;
import com.ferromax.erp.dto.AjusteStockResponse;
import com.ferromax.erp.security.JwtTokenProvider;
import com.ferromax.erp.service.AjusteStockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ajustes-stock")
@RequiredArgsConstructor
public class AjusteStockController {

    private final AjusteStockService ajusteStockService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AjusteStockResponse> ajustar(
            @Valid @RequestBody AjusteStockRequest request,
            @RequestHeader("Authorization") String authHeader) {

        Long adminId = jwtTokenProvider.obtenerUsuarioIdDesdeToken(authHeader.substring(7));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ajusteStockService.ajustar(request, adminId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AjusteStockResponse>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        return ResponseEntity.ok(ajusteStockService.listarAjustes(page, size));
    }
}
