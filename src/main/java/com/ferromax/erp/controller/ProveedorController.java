package com.ferromax.erp.controller;

import com.ferromax.erp.model.Proveedor;
import com.ferromax.erp.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/proveedores")
@RequiredArgsConstructor
public class ProveedorController {

    private final ProveedorRepository proveedorRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    public ResponseEntity<List<Map<String, Object>>> listar() {
        List<Map<String, Object>> resultado = proveedorRepository.findAll().stream()
                .filter(p -> p.getNombre() != null)
                .sorted((a, b) -> a.getNombre().compareToIgnoreCase(b.getNombre()))
                .map(p -> Map.<String, Object>of("id", p.getId(), "nombre", p.getNombre()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(resultado);
    }
}
