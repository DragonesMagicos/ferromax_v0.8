package com.ferromax.erp.controller;

import com.ferromax.erp.dto.CategoriaPublicaDTO;
import com.ferromax.erp.dto.PaginaCatalogoDTO;
import com.ferromax.erp.repository.CategoriaRepository;
import com.ferromax.erp.service.CatalogoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CatalogoService catalogoService;
    private final CategoriaRepository categoriaRepository;

    @GetMapping
    public ResponseEntity<List<CategoriaPublicaDTO>> listarPublico() {
        return ResponseEntity.ok(catalogoService.listarCategoriasPublico());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> listarAdmin() {
        return ResponseEntity.ok(
            categoriaRepository.findAll().stream()
                .sorted((a, b) -> a.getNombre().compareToIgnoreCase(b.getNombre()))
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", c.getId());
                    m.put("nombre", c.getNombre());
                    return m;
                })
                .toList()
        );
    }

    @GetMapping("/productos")
    public ResponseEntity<PaginaCatalogoDTO> listarProductos(
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String subcategoria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        return ResponseEntity.ok(catalogoService.listarProductosCatalogo(categoria, subcategoria, page, size));
    }
}
