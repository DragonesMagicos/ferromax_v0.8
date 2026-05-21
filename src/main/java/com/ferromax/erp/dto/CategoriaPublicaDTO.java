package com.ferromax.erp.dto;

import java.util.List;

public record CategoriaPublicaDTO(
        String nombre,
        int totalProductos,
        List<String> subcategorias,
        List<String> imagenesPreview
) {}
