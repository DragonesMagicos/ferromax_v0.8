package com.ferromax.erp.service;

import com.ferromax.erp.dto.CategoriaPublicaDTO;
import com.ferromax.erp.dto.PaginaCatalogoDTO;
import com.ferromax.erp.dto.ProductoCatalogoDTO;
import com.ferromax.erp.model.Categoria;
import com.ferromax.erp.model.Producto;
import com.ferromax.erp.repository.CategoriaRepository;
import com.ferromax.erp.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CatalogoService {

    private static final Pattern PAT_MARCA    = Pattern.compile("Marca:\\s*([^|]+)");
    private static final Pattern PAT_SUBCAT   = Pattern.compile("Subcategoría:\\s*([^|]+)");

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository  productoRepository;

    @Transactional(readOnly = true)
    public List<CategoriaPublicaDTO> listarCategoriasPublico() {
        return categoriaRepository.findAll().stream()
                .filter(cat -> productoRepository.countByCategoriaAndActivoTrue(cat) > 0)
                .map(this::toCategoriaDTO)
                .sorted(Comparator.comparing(CategoriaPublicaDTO::nombre))
                .toList();
    }

    @Transactional(readOnly = true)
    public PaginaCatalogoDTO listarProductosCatalogo(String categoria, String subcategoria, int page, int size) {
        int pageSize = Math.min(size, 48);
        PageRequest pageable = PageRequest.of(page, pageSize);

        Page<Producto> paginaDb;

        if (categoria != null && !categoria.isBlank()) {
            Optional<Categoria> catOpt = categoriaRepository.findByNombre(categoria);
            if (catOpt.isEmpty()) return PaginaCatalogoDTO.vacia();
            Categoria cat = catOpt.get();

            if (subcategoria != null && !subcategoria.isBlank()) {
                String subLike = "%Subcategoría: " + subcategoria.trim() + "%";
                paginaDb = productoRepository.findByCategoriaAndSubcategoria(cat, subLike, pageable);
            } else {
                paginaDb = productoRepository.findByCategoriaAndActivoTrueOrderByNombreAsc(cat, pageable);
            }
        } else {
            paginaDb = productoRepository.findByActivoTrueOrderByNombreAsc(pageable);
        }

        List<ProductoCatalogoDTO> contenido = paginaDb.getContent().stream()
                .map(this::toProductoDTO)
                .toList();

        return new PaginaCatalogoDTO(contenido, paginaDb.getNumber(),
                paginaDb.getTotalPages(), paginaDb.getTotalElements());
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private CategoriaPublicaDTO toCategoriaDTO(Categoria cat) {
        long total = productoRepository.countByCategoriaAndActivoTrue(cat);

        List<Producto> todos = productoRepository.findByCategoriaAndActivoTrueOrderByNombreAsc(cat);

        LinkedHashSet<String> subcats = new LinkedHashSet<>();
        for (Producto p : todos) {
            String sub = extraer(PAT_SUBCAT, p.getDescripcion());
            if (!sub.isEmpty()) subcats.add(sub);
        }

        List<String> previews = productoRepository
                .findTop4ByCategoriaAndActivoTrueAndImagenUrlNotNullOrderByNombreAsc(cat)
                .stream()
                .map(p -> normalizarUrl(p.getImagenUrl()))
                .toList();

        return new CategoriaPublicaDTO(cat.getNombre(), (int) total,
                new ArrayList<>(subcats), previews);
    }

    private ProductoCatalogoDTO toProductoDTO(Producto p) {
        return new ProductoCatalogoDTO(
                p.getId(),
                p.getSku(),
                p.getNombre(),
                extraer(PAT_MARCA, p.getDescripcion()),
                p.getPrecio(),
                p.getStockActual(),
                derivarDisponibilidad(p),
                normalizarUrl(p.getImagenUrl()),
                p.getCategoria() != null ? p.getCategoria().getNombre() : null,
                extraer(PAT_SUBCAT, p.getDescripcion())
        );
    }

    private String extraer(Pattern patron, String descripcion) {
        if (descripcion == null) return "";
        Matcher m = patron.matcher(descripcion);
        return m.find() ? m.group(1).trim() : "";
    }

    private String derivarDisponibilidad(Producto p) {
        if (!Boolean.TRUE.equals(p.getActivo()) || p.getStockActual() == 0) return "SIN STOCK";
        if (p.getStockActual() <= 5)  return "STOCK BAJO";
        if (p.getStockActual() <= 20) return "STOCK MEDIO";
        return "STOCK ALTO";
    }

    /** Normaliza ./img/... → /api/img/... para que el proxy de Vite lo resuelva. */
    private String normalizarUrl(String url) {
        if (url == null) return null;
        if (url.startsWith("./")) return "/api/img/" + url.substring("./img/".length());
        return url;
    }
}
