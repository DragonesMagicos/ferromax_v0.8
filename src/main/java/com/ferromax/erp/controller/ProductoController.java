package com.ferromax.erp.controller;

import com.ferromax.erp.dto.ProductoCreateRequest;
import com.ferromax.erp.dto.ProductoDTO;
import com.ferromax.erp.dto.ProductoEmpleadoDTO;
import com.ferromax.erp.dto.ProductoPublicoDTO;
import com.ferromax.erp.dto.ProductoRapidoRequest;
import com.ferromax.erp.dto.ProductoUpdateRequest;
import com.ferromax.erp.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    // ── ADMIN: incluye precioCompra y nombreProveedor ────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProductoDTO>> listarTodos() {
        return ResponseEntity.ok(productoService.listarTodos());
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> buscar(
            @RequestParam String q,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(productoService.buscarPorTexto(q, limit));
    }

    @GetMapping("/imagenes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> buscarImagenes(@RequestParam String q) {
        return ResponseEntity.ok(productoService.buscarImagenes(q));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.buscarPorId(id));
    }

    @GetMapping("/sku/{sku}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoDTO> buscarPorSku(@PathVariable String sku) {
        return ResponseEntity.ok(productoService.buscarPorSku(sku));
    }

    @GetMapping("/barcode/{codigo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoDTO> buscarPorCodigoBarras(@PathVariable String codigo) {
        return ResponseEntity.ok(productoService.buscarPorCodigoBarras(codigo));
    }

    // ── EMPLEADO: sin precioCompra ni nombreProveedor ────────────────────────

    @GetMapping("/empleado")
    @PreAuthorize("hasRole('EMPLEADO')")
    public ResponseEntity<List<ProductoEmpleadoDTO>> listarParaEmpleado() {
        return ResponseEntity.ok(productoService.listarParaEmpleado());
    }

    @GetMapping("/empleado/sku/{sku}")
    @PreAuthorize("hasRole('EMPLEADO')")
    public ResponseEntity<ProductoEmpleadoDTO> buscarPorSkuEmpleado(@PathVariable String sku) {
        return ResponseEntity.ok(productoService.buscarPorSkuParaEmpleado(sku));
    }

    @GetMapping("/empleado/barcode/{codigo}")
    @PreAuthorize("hasRole('EMPLEADO')")
    public ResponseEntity<ProductoEmpleadoDTO> buscarPorCodigoBarrasEmpleado(@PathVariable String codigo) {
        return ResponseEntity.ok(productoService.buscarPorCodigoBarrasParaEmpleado(codigo));
    }

    @PostMapping("/empleado/rapido")
    @PreAuthorize("hasRole('EMPLEADO')")
    public ResponseEntity<ProductoEmpleadoDTO> crearRapido(@Valid @RequestBody ProductoRapidoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productoService.crearRapidoDesdeRecepcion(request));
    }

    @GetMapping("/empleado/imagenes")
    @PreAuthorize("hasRole('EMPLEADO')")
    public ResponseEntity<List<String>> buscarImagenesEmpleado(@RequestParam String q) {
        return ResponseEntity.ok(productoService.buscarImagenes(q));
    }

    @GetMapping("/stock-critico")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProductoDTO>> stockCritico() {
        return ResponseEntity.ok(productoService.obtenerStockCritico());
    }

    @GetMapping("/publico")
    public ResponseEntity<List<ProductoPublicoDTO>> catalogo() {
        return ResponseEntity.ok(productoService.listarPublico());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoDTO> crear(@Valid @RequestBody ProductoCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productoService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoDTO> actualizar(@PathVariable Long id,
                                                   @Valid @RequestBody ProductoUpdateRequest request) {
        return ResponseEntity.ok(productoService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        productoService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
