package com.ferromax.erp.controller;

import com.ferromax.erp.dto.CategoriaPublicaDTO;
import com.ferromax.erp.dto.PaginaCatalogoDTO;
import com.ferromax.erp.service.CatalogoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CatalogoService catalogoService;

    @GetMapping
    public ResponseEntity<List<CategoriaPublicaDTO>> listarPublico() {
        return ResponseEntity.ok(catalogoService.listarCategoriasPublico());
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
