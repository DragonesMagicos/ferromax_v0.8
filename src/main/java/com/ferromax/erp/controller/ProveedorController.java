package com.ferromax.erp.controller;

import com.ferromax.erp.model.FacturaIngreso;
import com.ferromax.erp.model.Proveedor;
import com.ferromax.erp.repository.FacturaIngresoRepository;
import com.ferromax.erp.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/proveedores")
@RequiredArgsConstructor
public class ProveedorController {

    private final ProveedorRepository proveedorRepository;
    private final FacturaIngresoRepository facturaIngresoRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    public ResponseEntity<List<Map<String, Object>>> listar() {
        List<Map<String, Object>> resultado = proveedorRepository.findAll().stream()
                .filter(p -> p.getNombre() != null)
                .sorted((a, b) -> a.getNombre().compareToIgnoreCase(b.getNombre()))
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    public ResponseEntity<Map<String, Object>> obtener(@PathVariable Long id) {
        return proveedorRepository.findById(id)
                .map(p -> ResponseEntity.ok(toMap(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> crear(@RequestBody Map<String, Object> body) {
        Proveedor p = new Proveedor();
        aplicarCampos(p, body);
        return ResponseEntity.ok(toMap(proveedorRepository.save(p)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return proveedorRepository.findById(id).map(p -> {
            aplicarCampos(p, body);
            return ResponseEntity.ok(toMap(proveedorRepository.save(p)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!proveedorRepository.existsById(id)) return ResponseEntity.notFound().build();
        proveedorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/facturas")
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    public ResponseEntity<List<Map<String, Object>>> facturas(@PathVariable Long id) {
        return proveedorRepository.findById(id).map(proveedor -> {
            List<FacturaIngreso> facturas = facturaIngresoRepository
                    .findByProveedorOrderByCreatedAtDesc(proveedor);
            List<Map<String, Object>> resultado = facturas.stream().map(f -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", f.getId());
                m.put("numeroFactura", f.getNumeroFactura());
                m.put("estado", f.getEstado() != null ? f.getEstado().name() : null);
                m.put("cantidadItems", f.getItems().size());
                m.put("archivoNombre", f.getArchivoNombre());
                m.put("createdAt", f.getCreatedAt());
                m.put("confirmadoAt", f.getConfirmadoAt());
                m.put("notas", f.getNotas());
                return m;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(resultado);
        }).orElse(ResponseEntity.notFound().build());
    }

    private void aplicarCampos(Proveedor p, Map<String, Object> body) {
        if (body.containsKey("nombre"))        p.setNombre((String) body.get("nombre"));
        if (body.containsKey("ruc"))           p.setRuc((String) body.get("ruc"));
        if (body.containsKey("telefono"))      p.setTelefono((String) body.get("telefono"));
        if (body.containsKey("email"))         p.setEmail((String) body.get("email"));
        if (body.containsKey("condicionPago")) p.setCondicionPago((String) body.get("condicionPago"));
        if (body.containsKey("lineaCredito") && body.get("lineaCredito") != null) {
            p.setLineaCredito(new BigDecimal(body.get("lineaCredito").toString()));
        }
    }

    private Map<String, Object> toMap(Proveedor p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("nombre", p.getNombre());
        m.put("ruc", p.getRuc());
        m.put("telefono", p.getTelefono());
        m.put("email", p.getEmail());
        m.put("condicionPago", p.getCondicionPago());
        m.put("lineaCredito", p.getLineaCredito());
        m.put("createdAt", p.getCreatedAt());
        return m;
    }
}
