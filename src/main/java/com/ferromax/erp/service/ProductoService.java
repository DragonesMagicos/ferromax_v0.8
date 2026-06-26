package com.ferromax.erp.service;

import com.ferromax.erp.dto.ProductoCreateRequest;
import com.ferromax.erp.dto.ProductoDTO;
import com.ferromax.erp.dto.ProductoEmpleadoDTO;
import com.ferromax.erp.dto.ProductoPublicoDTO;
import com.ferromax.erp.dto.ProductoUpdateRequest;
import com.ferromax.erp.exception.RecursoNoEncontradoException;
import com.ferromax.erp.model.AlertaStock;
import com.ferromax.erp.model.MovimientoStock;
import com.ferromax.erp.model.Producto;
import com.ferromax.erp.model.TipoMovimientoEnum;
import com.ferromax.erp.repository.AlertaStockRepository;
import com.ferromax.erp.repository.CategoriaRepository;
import com.ferromax.erp.repository.MovimientoStockRepository;
import com.ferromax.erp.repository.ProductoRepository;
import com.ferromax.erp.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProveedorRepository proveedorRepository;
    private final MovimientoStockRepository movimientoStockRepository;
    private final AlertaStockRepository alertaStockRepository;

    @Transactional(readOnly = true)
    public List<ProductoDTO> listarTodos() {
        return productoRepository.findAllByActivoTrue()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<String> buscarImagenes(String query) {
        List<String> urls = new ArrayList<>();
        try {
            String q = URLEncoder.encode(query + " ferreteria producto", StandardCharsets.UTF_8);
            HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

            // Paso 1: obtener el token vqd de DuckDuckGo
            HttpRequest req1 = HttpRequest.newBuilder()
                .uri(URI.create("https://duckduckgo.com/?q=" + q + "&ia=images"))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .GET().build();
            String html = client.send(req1, HttpResponse.BodyHandlers.ofString()).body();

            Matcher vqdMatcher = Pattern.compile("vqd=['\"](\\d+-\\d+(?:-\\d+)?)").matcher(html);
            if (!vqdMatcher.find()) {
                // fallback: buscar en formato alternativo
                vqdMatcher = Pattern.compile("vqd=([\\d-]+)").matcher(html);
                if (!vqdMatcher.find()) return urls;
            }
            String vqd = vqdMatcher.group(1);

            // Paso 2: buscar imágenes
            HttpRequest req2 = HttpRequest.newBuilder()
                .uri(URI.create("https://duckduckgo.com/i.js?q=" + q + "&vqd=" + vqd + "&o=json&p=1&f=,,,,,"))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .header("Referer", "https://duckduckgo.com/")
                .GET().build();
            String json = client.send(req2, HttpResponse.BodyHandlers.ofString()).body();

            // Extraer URLs de "image":"..." del JSON
            Matcher imgMatcher = Pattern.compile("\"image\":\"(https?://[^\"]+)\"").matcher(json);
            while (imgMatcher.find() && urls.size() < 4) {
                String url = imgMatcher.group(1);
                // Filtrar imágenes muy pequeñas (thumbnails de 1px, etc.)
                if (!url.contains("1x1") && !url.contains("pixel") && url.matches(".*\\.(jpg|jpeg|png|webp)(\\?.*)?")) {
                    urls.add(url);
                }
            }
            // Si no encontró con extensión, agregar sin filtro de extensión
            if (urls.isEmpty()) {
                imgMatcher.reset();
                while (imgMatcher.find() && urls.size() < 4) {
                    urls.add(imgMatcher.group(1));
                }
            }
        } catch (Exception e) {
            log.warn("Error al buscar imágenes DuckDuckGo: {}", e.getMessage());
        }
        return urls;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> buscarPorTexto(String q, int limit) {
        return productoRepository.buscarPorNombreOSku(q.trim(), PageRequest.of(0, limit))
                .stream()
                .map(p -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("nombre", p.getNombre());
                    m.put("sku", p.getSku());
                    m.put("activo", p.getActivo());
                    return m;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductoDTO buscarPorSku(String sku) {
        Producto producto = productoRepository.findBySku(sku)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", "sku", sku));
        return toDTO(producto);
    }

    @Transactional(readOnly = true)
    public ProductoDTO buscarPorCodigoBarras(String codigo) {
        Producto producto = productoRepository.findByCodigoBarras(codigo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", "codigoBarras", codigo));
        return toDTO(producto);
    }

    @Transactional(readOnly = true)
    public ProductoDTO buscarPorId(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", id));
        return toDTO(producto);
    }

    @Transactional
    public ProductoDTO crear(ProductoCreateRequest request) {
        if (productoRepository.findBySku(request.sku()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un producto con el SKU '" + request.sku() + "'");
        }

        Producto producto = new Producto();
        producto.setSku(request.sku());
        producto.setCodigoBarras(request.codigoBarras());
        producto.setNombre(request.nombre());
        producto.setDescripcion(request.descripcion());
        producto.setPrecio(request.precio());
        producto.setPrecioCompra(request.precioCompra());
        producto.setStockMinimo(request.stockMinimo() != null ? request.stockMinimo() : 0);
        producto.setImagenUrl(request.imagenUrl());

        if (request.categoriaId() != null) {
            producto.setCategoria(categoriaRepository.findById(request.categoriaId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Categoria", request.categoriaId())));
        }

        if (request.proveedorId() != null) {
            producto.setProveedor(proveedorRepository.findById(request.proveedorId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Proveedor", request.proveedorId())));
        }

        return toDTO(productoRepository.save(producto));
    }

    @Transactional
    public ProductoDTO actualizarStock(Long productoId, Integer nuevaCantidad) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", productoId));

        int stockAnterior = producto.getStockActual();
        producto.setStockActual(nuevaCantidad);
        productoRepository.save(producto);

        registrarMovimiento(producto, nuevaCantidad - stockAnterior, stockAnterior, nuevaCantidad);
        generarAlertaSiCorresponde(producto, nuevaCantidad);

        return toDTO(producto);
    }

    @Transactional(readOnly = true)
    public List<ProductoDTO> obtenerStockCritico() {
        return productoRepository.findProductosConStockCritico()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoEmpleadoDTO> listarParaEmpleado() {
        return productoRepository.findAllByActivoTrue()
                .stream()
                .map(this::toEmpleadoDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductoEmpleadoDTO buscarPorSkuParaEmpleado(String sku) {
        return toEmpleadoDTO(productoRepository.findBySku(sku)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", "sku", sku)));
    }

    @Transactional(readOnly = true)
    public ProductoEmpleadoDTO buscarPorCodigoBarrasParaEmpleado(String codigo) {
        return toEmpleadoDTO(productoRepository.findByCodigoBarras(codigo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", "codigoBarras", codigo)));
    }

    @Transactional
    public ProductoEmpleadoDTO crearRapidoDesdeRecepcion(ProductoRapidoRequest request) {
        // SKU: si no se provee, usar el código de barras
        String sku = (request.sku() != null && !request.sku().isBlank())
                ? request.sku().toUpperCase()
                : request.codigoBarras().toUpperCase();

        if (productoRepository.findBySku(sku).isPresent()) {
            throw new IllegalArgumentException("Ya existe un producto con SKU: " + sku);
        }

        Producto producto = new Producto();
        producto.setSku(sku);
        producto.setCodigoBarras(request.codigoBarras());
        producto.setNombre(request.nombre());
        producto.setDescripcion(request.descripcion());
        producto.setPrecio(java.math.BigDecimal.ZERO); // precio a definir por admin
        producto.setStockActual(0);
        producto.setStockMinimo(0);
        producto.setImagenUrl(request.imagenUrl());
        producto.setActivo(true);

        return toEmpleadoDTO(productoRepository.save(producto));
    }

    @Transactional(readOnly = true)
    public List<ProductoPublicoDTO> listarPublico() {
        return productoRepository.findAllByActivoTrue().stream()
                .filter(p -> p.getStockActual() > 0)
                .map(p -> new ProductoPublicoDTO(
                        p.getId(),
                        p.getNombre(),
                        p.getPrecio(),
                        p.getStockActual(),
                        p.getImagenUrl(),
                        p.getCategoria() != null ? p.getCategoria().getNombre() : null))
                .sorted((a, b) -> {
                    boolean aImg = a.imagenUrl() != null && !a.imagenUrl().isBlank();
                    boolean bImg = b.imagenUrl() != null && !b.imagenUrl().isBlank();
                    return Boolean.compare(!aImg, !bImg);
                })
                .toList();
    }

    @Transactional
    public ProductoDTO actualizar(Long id, ProductoUpdateRequest request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", id));

        if (request.nombre() != null)        producto.setNombre(request.nombre());
        if (request.precio() != null)        producto.setPrecio(request.precio());
        if (request.stockMinimo() != null)   producto.setStockMinimo(request.stockMinimo());
        if (request.imagenUrl() != null)     producto.setImagenUrl(request.imagenUrl());
        if (request.codigoBarras() != null)  producto.setCodigoBarras(request.codigoBarras());

        return toDTO(productoRepository.save(producto));
    }

    @Transactional
    public void desactivar(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", id));
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private void registrarMovimiento(Producto producto, int cantidad, int stockAnterior, int stockNuevo) {
        MovimientoStock movimiento = new MovimientoStock();
        movimiento.setProducto(producto);
        movimiento.setTipo(TipoMovimientoEnum.AJUSTE);
        movimiento.setCantidad(cantidad);
        movimiento.setStockAnterior(stockAnterior);
        movimiento.setStockNuevo(stockNuevo);
        movimientoStockRepository.save(movimiento);
    }

    void generarAlertaSiCorrespondePublico(Producto producto, int stockNuevo) {
        generarAlertaSiCorresponde(producto, stockNuevo);
    }

    private void generarAlertaSiCorresponde(Producto producto, int stockNuevo) {
        if (stockNuevo == 0) {
            guardarAlerta(producto, "SIN_STOCK");
        } else if (stockNuevo <= producto.getStockMinimo()) {
            guardarAlerta(producto, "STOCK_CRITICO");
        }
    }

    private void guardarAlerta(Producto producto, String tipo) {
        AlertaStock alerta = new AlertaStock();
        alerta.setProducto(producto);
        alerta.setAlertaEnum(tipo);
        alertaStockRepository.save(alerta);
    }

    private ProductoEmpleadoDTO toEmpleadoDTO(Producto p) {
        return new ProductoEmpleadoDTO(
                p.getId(),
                p.getSku(),
                p.getCodigoBarras(),
                p.getNombre(),
                p.getDescripcion(),
                p.getPrecio(),
                p.getStockActual(),
                p.getStockMinimo(),
                p.getImagenUrl(),
                p.getCategoria() != null ? p.getCategoria().getNombre() : null
        );
    }

    private ProductoDTO toDTO(Producto p) {
        return new ProductoDTO(
                p.getId(),
                p.getSku(),
                p.getCodigoBarras(),
                p.getNombre(),
                p.getDescripcion(),
                p.getPrecio(),
                p.getStockActual(),
                p.getStockMinimo(),
                p.getActivo(),
                p.getImagenUrl(),
                p.getCategoria() != null ? p.getCategoria().getNombre() : null,
                p.getProveedor() != null ? p.getProveedor().getNombre() : null
        );
    }
}
