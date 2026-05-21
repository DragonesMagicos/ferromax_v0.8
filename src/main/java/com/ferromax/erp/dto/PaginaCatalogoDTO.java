package com.ferromax.erp.dto;

import java.util.List;

public record PaginaCatalogoDTO(
        List<ProductoCatalogoDTO> contenido,
        int paginaActual,
        int totalPaginas,
        long totalElementos
) {
    public static PaginaCatalogoDTO vacia() {
        return new PaginaCatalogoDTO(List.of(), 0, 0, 0);
    }
}
