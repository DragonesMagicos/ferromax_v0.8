package com.ferromax.erp.controller;

import com.ferromax.erp.dto.RecepcionRequest;
import com.ferromax.erp.dto.RecepcionResponse;
import com.ferromax.erp.security.JwtTokenProvider;
import com.ferromax.erp.service.RecepcionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/recepcion")
@RequiredArgsConstructor
public class RecepcionController {

    private final RecepcionService recepcionService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    public ResponseEntity<RecepcionResponse> recibirMercaderia(
            @Valid @RequestBody RecepcionRequest request,
            @RequestHeader("Authorization") String authHeader) {

        Long empleadoId = jwtTokenProvider.obtenerUsuarioIdDesdeToken(authHeader.substring(7));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recepcionService.recibirMercaderia(request, empleadoId));
    }
}
