package com.ferromax.erp.service;

import com.ferromax.erp.dto.*;
import com.ferromax.erp.model.*;
import com.ferromax.erp.repository.FacturaIngresoRepository;
import com.ferromax.erp.repository.ProductoRepository;
import com.ferromax.erp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FacturaService {

    private final ProductoRepository productoRepository;
    private final FacturaIngresoRepository facturaIngresoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RecepcionService recepcionService;

    @Value("${ocr.space.api.key}")
    private String ocrSpaceApiKey;

    // ── Extracción de texto ────────────────────────────────────────────────────

    @Transactional
    public FacturaAnalisisResponse analizarFactura(MultipartFile archivo, Long usuarioId) {
        try {
            String contentType = archivo.getContentType() != null ? archivo.getContentType() : "";
            String texto;

            if (contentType.equals("application/pdf")) {
                texto = extraerTextoPDF(archivo);
            } else {
                texto = extraerTextoImagen(archivo);
            }

            log.info("=== TEXTO EXTRAÍDO DEL DOCUMENTO ===\n{}\n=== FIN TEXTO ===", texto);

            FacturaAnalisisResponse analisis = parsearTexto(texto);
            FacturaAnalisisResponse conMatch = matchearProductos(analisis);

            // Guardar borrador en BD
            FacturaIngreso factura = new FacturaIngreso();
            factura.setNumeroFactura(conMatch.numeroFactura());
            factura.setProveedorNombre(conMatch.proveedor());
            factura.setArchivoNombre(archivo.getOriginalFilename());
            factura.setEstado(EstadoFacturaEnum.BORRADOR);
            factura.setUsuario(usuarioRepository.findById(usuarioId).orElse(null));

            for (ItemFacturaDTO dto : conMatch.items()) {
                ItemFacturaIngreso item = new ItemFacturaIngreso();
                item.setFacturaIngreso(factura);
                item.setDescripcionOriginal(dto.descripcion());
                item.setCodigoSkuOriginal(dto.codigoSku());
                item.setCantidad(dto.cantidad() != null ? dto.cantidad() : 0);
                item.setPrecioUnitario(dto.precioUnitario() != null
                        ? BigDecimal.valueOf(dto.precioUnitario()) : BigDecimal.ZERO);
                if (dto.productoId() != null) {
                    item.setProducto(productoRepository.findById(dto.productoId()).orElse(null));
                }
                factura.getItems().add(item);
            }

            FacturaIngreso guardada = facturaIngresoRepository.save(factura);
            log.info("Factura borrador guardada con ID {}", guardada.getId());

            return new FacturaAnalisisResponse(
                    conMatch.proveedor(), conMatch.numeroFactura(),
                    conMatch.items(), guardada.getId()
            );

        } catch (Exception e) {
            log.error("Error al analizar factura", e);
            throw new RuntimeException("No se pudo procesar el documento: " + e.getMessage(), e);
        }
    }

    private String extraerTextoPDF(MultipartFile archivo) throws IOException {
        try (PDDocument doc = Loader.loadPDF(archivo.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(doc);
        }
    }

    private String extraerTextoImagen(MultipartFile archivo) throws IOException {
        try {
            byte[] bytes = archivo.getBytes();
            String mimeType = archivo.getContentType() != null ? archivo.getContentType() : "image/jpeg";
            String base64Data = "data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(bytes);

            // Multipart form-data para OCR.space
            String boundary = "----FormBoundary" + System.currentTimeMillis();
            String crlf = "\r\n";
            StringBuilder sb = new StringBuilder();
            // apikey
            sb.append("--").append(boundary).append(crlf)
              .append("Content-Disposition: form-data; name=\"apikey\"").append(crlf).append(crlf)
              .append(ocrSpaceApiKey).append(crlf);
            // base64Image
            sb.append("--").append(boundary).append(crlf)
              .append("Content-Disposition: form-data; name=\"base64Image\"").append(crlf).append(crlf)
              .append(base64Data).append(crlf);
            // language
            sb.append("--").append(boundary).append(crlf)
              .append("Content-Disposition: form-data; name=\"language\"").append(crlf).append(crlf)
              .append("spa").append(crlf);
            // isTable
            sb.append("--").append(boundary).append(crlf)
              .append("Content-Disposition: form-data; name=\"isTable\"").append(crlf).append(crlf)
              .append("true").append(crlf);
            // OCREngine 2 (mejor para fotos)
            sb.append("--").append(boundary).append(crlf)
              .append("Content-Disposition: form-data; name=\"OCREngine\"").append(crlf).append(crlf)
              .append("2").append(crlf);
            sb.append("--").append(boundary).append("--").append(crlf);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.ocr.space/parse/image"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofString(sb.toString()))
                .build();

            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            log.info("OCR.space status: {}", resp.statusCode());

            if (resp.statusCode() != 200) {
                log.warn("OCR.space error HTTP: {}", resp.body());
                return "";
            }

            // Parsear "ParsedText" sin regex para evitar StackOverflow en textos largos
            String body = resp.body();
            int keyIdx = body.indexOf("\"ParsedText\"");
            if (keyIdx < 0) {
                log.warn("OCR.space: sin ParsedText. Resp: {}", body.substring(0, Math.min(300, body.length())));
                return "";
            }
            int strStart = body.indexOf('"', keyIdx + 12) + 1; // primer " después de ":"
            if (strStart <= 0) return "";
            // Recorrer el valor JSON string carácter a carácter, respetando escapes
            StringBuilder sb2 = new StringBuilder();
            int i = strStart;
            while (i < body.length()) {
                char c = body.charAt(i);
                if (c == '"') break; // fin del valor
                if (c == '\\' && i + 1 < body.length()) {
                    char esc = body.charAt(i + 1);
                    switch (esc) {
                        case 'n' -> { sb2.append('\n'); i += 2; continue; }
                        case 'r' -> { i += 2; continue; }
                        case 't' -> { sb2.append('\t'); i += 2; continue; }
                        case '"' -> { sb2.append('"');  i += 2; continue; }
                        case '\\' -> { sb2.append('\\'); i += 2; continue; }
                        default  -> { sb2.append(esc); i += 2; continue; }
                    }
                }
                sb2.append(c);
                i++;
            }
            String texto = sb2.toString();
            log.info("OCR.space extrajo {} caracteres", texto.length());
            return texto;

        } catch (Exception e) {
            log.warn("Error OCR.space: {}. Se devolverá texto vacío.", e.getMessage());
            return "";
        }
    }

    // ── Parsing ────────────────────────────────────────────────────────────────

    private FacturaAnalisisResponse parsearTexto(String texto) {
        String[] lineas = texto.split("\\r?\\n");

        String proveedor     = detectarProveedor(lineas);
        String numeroFactura = detectarNumeroFactura(texto);
        List<ItemFacturaDTO> items = extraerItems(lineas);

        return new FacturaAnalisisResponse(proveedor, numeroFactura, items, null);
    }

    private String detectarProveedor(String[] lineas) {
        // Las primeras líneas no vacías suelen tener el nombre del proveedor
        for (String linea : lineas) {
            String l = linea.trim();
            if (l.length() > 3 && l.length() < 80
                    && !l.matches(".*\\d{2}/\\d{2}/\\d{4}.*")   // no es fecha
                    && !l.toLowerCase().contains("factura")
                    && !l.toLowerCase().contains("remito")) {
                return l;
            }
        }
        return null;
    }

    private String detectarNumeroFactura(String texto) {
        // Patrones: "Factura N° 0001-00012345", "Fact. 0001-00001234", "N° 00012345"
        Pattern[] patrones = {
            Pattern.compile("(?i)factura\\s*[n°nro\\.]*\\s*([\\d]{4}-[\\d]{6,8})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i)(?:factura|fact\\.?)\\s*(?:n[°ro\\.]*)?\\s*(\\d{4}-\\d+)"),
            Pattern.compile("(?i)n[°o]\\.?\\s*(\\d{4}-\\d{4,})"),
            Pattern.compile("(?i)comprobante\\s*n[°o]\\.?\\s*(\\d+)"),
        };
        for (Pattern p : patrones) {
            Matcher m = p.matcher(texto);
            if (m.find()) return m.group(1);
        }
        return null;
    }

    // Palabras que indican que una línea NO es un ítem de factura
    private static final Set<String> PALABRAS_NO_ITEM = Set.of(
        "total", "subtotal", "iva", "neto", "descuento", "bonificacion", "saldo",
        "vencimiento", "fecha", "cuil", "cuit", "domicilio", "telefono", "email",
        "calle", "provincia", "ciudad", "banco", "cuenta", "remito", "condicion",
        "factura", "recibo", "comprobante", "observacion", "firma", "pago"
    );

    private List<ItemFacturaDTO> extraerItems(String[] lineas) {
        List<ItemFacturaDTO> items = new ArrayList<>();

        // Si el texto viene de Gemini en formato COD|CANT|DESC|PRECIO — procesar directo
        boolean esFormatoGemini = Arrays.stream(lineas)
            .filter(l -> !l.isBlank())
            .limit(5)
            .anyMatch(l -> l.contains("|") && l.split("\\|").length >= 3);

        if (esFormatoGemini) {
            for (String linea : lineas) {
                String l = linea.trim();
                if (l.isBlank() || !l.contains("|")) continue;
                String[] partes = l.split("\\|", -1);
                if (partes.length < 3) continue;
                try {
                    String sku    = partes[0].trim().toUpperCase();
                    int    cant   = parsearEntero(partes[1].trim());
                    String desc   = partes[2].trim();
                    double precio = partes.length >= 4 ? parsearDecimal(partes[3].trim()) : 0.0;
                    if (desc.isBlank() || cant <= 0) continue;
                    items.add(new ItemFacturaDTO(desc, sku.isBlank() ? null : sku, cant, precio, null, null));
                    log.debug("Gemini ítem: {} | SKU:{} | cant:{} | precio:{}", partes[2].trim(), partes[0].trim(), partes[1].trim(), partes.length >= 4 ? partes[3].trim() : "-");
                } catch (Exception e) {
                    log.debug("Línea Gemini ignorada: {}", l);
                }
            }
            return items;
        }

        // Precio: 1-7 dígitos + coma/punto + 2 decimales. Ej: 6420,00  13938,47
        // Usamos grupos atómicos simulados con possessive quantifiers para evitar backtracking
        Pattern pPrecio = Pattern.compile("\\d{1,7}[,.]\\d{2}");

        boolean dentroDeTabla = false;

        for (String linea : lineas) {
            try {
            // Limpiar ruido OCR
            String l = linea.trim()
                .replace("|", " ").replace("[", " ").replace("]", " ")
                .replace("—", " ").replace(")", " ")
                .replaceAll("[ \\t]+", " ").trim();

            if (l.isEmpty() || l.length() < 4 || l.length() > 200) continue;

            String lLower = l.toLowerCase();

            // Detectar cabecera de tabla
            if (lLower.contains("descrip") || lLower.contains("unidad") || lLower.contains("p.unitario")) {
                dentroDeTabla = true; continue;
            }
            // Filtrar pie
            if (lLower.startsWith("total") || lLower.startsWith("subtotal") || lLower.startsWith("iva")) continue;
            boolean esNoItem = PALABRAS_NO_ITEM.stream().anyMatch(kw ->
                lLower.equals(kw) || lLower.startsWith(kw + " ") || lLower.startsWith(kw + ":"));
            if (esNoItem) continue;

            // Dividir la línea en tokens por espacios
            String[] tok = l.split(" ");
            if (tok.length < 2) continue;

            ItemFacturaDTO item = parsearTokens(tok, pPrecio, dentroDeTabla);

            if (item != null) {
                log.debug("Ítem: {} | SKU:{} | cant:{} | precio:{}", item.descripcion(), item.codigoSku(), item.cantidad(), item.precioUnitario());
                items.add(item);
            }
            } catch (Exception e) {
                log.debug("Línea ignorada por error: {}", linea);
            }
        }
        return items;
    }

    // Parseo basado en tokens — evita backtracking catastrófico de regex complejos
    private ItemFacturaDTO parsearTokens(String[] tok, Pattern pPrecio, boolean dentroDeTabla) {
        int n = tok.length;

        // Identificar el precio unitario: último o penúltimo token que sea precio
        // (si hay dos precios al final, el penúltimo es P.Unitario y el último es Total)
        int iPrecio = -1;
        for (int i = n - 1; i >= 1; i--) {
            if (pPrecio.matcher(tok[i]).matches()) { iPrecio = i; break; }
        }

        // Identificar código al inicio: token alfanumérico corto (ej: j111, na7520, B491)
        int iCod = -1;
        if (tok[0].matches("[A-Za-z]{1,4}\\d{2,6}[A-Za-z]?")) iCod = 0;

        // Identificar cantidad: primer token numérico entero (sin coma/punto)
        int iCant = -1;
        int desde = iCod >= 0 ? 1 : 0;
        for (int i = desde; i < n; i++) {
            if (tok[i].matches("\\d{1,4}") && Integer.parseInt(tok[i]) > 0 && Integer.parseInt(tok[i]) <= 9999) {
                iCant = i; break;
            }
        }

        if (iCant < 0) return null; // sin cantidad no hay ítem

        // La descripción es todo lo que está entre la cantidad y el precio
        int descDesde = iCant + 1;
        int descHasta = iPrecio >= 0 ? iPrecio : n;
        if (descDesde >= descHasta) return null;

        String desc = String.join(" ", Arrays.copyOfRange(tok, descDesde, descHasta)).trim();
        if (desc.length() < 3) return null;
        if (esFalsoPositivo(desc)) return null;

        int cant = Integer.parseInt(tok[iCant]);
        double precio = iPrecio >= 0 ? parsearDecimal(tok[iPrecio]) : 0.0;
        String sku = iCod >= 0 ? tok[iCod].toUpperCase() : null;

        // Si no hay precio y no estamos en tabla, descartar
        if (precio <= 0 && !dentroDeTabla) return null;

        return new ItemFacturaDTO(desc, sku, cant, precio, null, null);
    }

    private boolean esFalsoPositivo(String desc) {
        if (desc == null || desc.length() < 3) return true;
        String d = desc.toLowerCase();
        return PALABRAS_NO_ITEM.stream().anyMatch(kw -> d.startsWith(kw) || d.contains(" " + kw + " ") || d.endsWith(" " + kw));
    }

    private int parsearEntero(String s) {
        try {
            return Integer.parseInt(s.replaceAll("[.,].*", "").replaceAll("[^\\d]", ""));
        } catch (Exception e) { return 0; }
    }

    private double parsearDecimal(String s) {
        try {
            // Normalizar formato argentino: 1.234,56 → 1234.56
            String limpio = s.replaceAll("[\\$\\s]", "");
            if (limpio.contains(",") && limpio.contains(".")) {
                limpio = limpio.replace(".", "").replace(",", ".");
            } else if (limpio.contains(",")) {
                limpio = limpio.replace(",", ".");
            }
            return Double.parseDouble(limpio);
        } catch (Exception e) { return 0.0; }
    }

    // ── Match con productos existentes ─────────────────────────────────────────

    private FacturaAnalisisResponse matchearProductos(FacturaAnalisisResponse analisis) {
        List<Producto> todos = productoRepository.findAll();

        List<ItemFacturaDTO> matcheados = analisis.items().stream().map(item -> {
            Producto match = buscarMatch(item, todos);
            if (match != null) {
                return new ItemFacturaDTO(item.descripcion(), item.codigoSku(),
                        item.cantidad(), item.precioUnitario(), match.getId(), match.getNombre());
            }
            return item;
        }).collect(Collectors.toList());

        return new FacturaAnalisisResponse(analisis.proveedor(), analisis.numeroFactura(), matcheados, null);
    }

    private Producto buscarMatch(ItemFacturaDTO item, List<Producto> productos) {
        if (item.codigoSku() != null && !item.codigoSku().isBlank()) {
            String sku = item.codigoSku().trim().toLowerCase();
            Optional<Producto> porSku = productos.stream()
                    .filter(p -> p.getSku() != null && p.getSku().toLowerCase().equals(sku))
                    .findFirst();
            if (porSku.isPresent()) return porSku.get();
        }
        if (item.descripcion() != null && !item.descripcion().isBlank()) {
            String desc = item.descripcion().trim().toLowerCase();
            String[] palabras = desc.split("\\s+");
            Optional<Producto> porNombre = productos.stream()
                    .filter(p -> p.getNombre() != null && Arrays.stream(palabras)
                            .filter(pal -> pal.length() > 3)
                            .anyMatch(pal -> p.getNombre().toLowerCase().contains(pal)))
                    .findFirst();
            if (porNombre.isPresent()) return porNombre.get();
        }
        return null;
    }

    // ── Confirmar ingreso ──────────────────────────────────────────────────────

    @Transactional
    public List<RecepcionResponse> confirmarIngreso(FacturaConfirmarRequest request, Long usuarioId) {
        List<RecepcionResponse> resultados = new ArrayList<>();
        String notas = request.notas() != null ? request.notas() : "Ingreso por factura escaneada";

        // Actualizar la factura en BD si viene con ID
        FacturaIngreso factura = null;
        if (request.facturaId() != null) {
            factura = facturaIngresoRepository.findById(request.facturaId()).orElse(null);
        }

        for (ItemConfirmarDTO item : request.items()) {
            if (item.cantidad() == null || item.cantidad() <= 0) continue;

            // Resolver productoId: primero por ID explícito, luego por SKU
            Long prodIdResuelto = item.productoId();
            if (prodIdResuelto == null && item.codigoSku() != null && !item.codigoSku().isBlank()) {
                prodIdResuelto = productoRepository.findBySku(item.codigoSku().trim())
                        .map(Producto::getId)
                        .orElse(null);
                if (prodIdResuelto == null) {
                    log.warn("SKU '{}' no encontrado en el catálogo, se omite el ítem", item.codigoSku());
                    continue;
                }
            }
            if (prodIdResuelto == null) continue;
            final Long prodId = prodIdResuelto;

            RecepcionRequest rec = new RecepcionRequest(prodId, item.cantidad(), notas, null);
            resultados.add(recepcionService.recibirMercaderia(rec, usuarioId));

            // Marcar item como ingresado en la factura guardada
            if (factura != null) {
                factura.getItems().stream()
                        .filter(i -> i.getProducto() != null && i.getProducto().getId().equals(prodId))
                        .findFirst()
                        .ifPresent(i -> i.setIngresadoAlStock(true));
            }
        }

        if (factura != null) {
            factura.setEstado(EstadoFacturaEnum.CONFIRMADA);
            factura.setConfirmadoAt(OffsetDateTime.now());
            factura.setNotas(notas);
            if (request.proveedor() != null && !request.proveedor().isBlank())
                factura.setProveedorNombre(request.proveedor());
            if (request.nroFactura() != null && !request.nroFactura().isBlank())
                factura.setNumeroFactura(request.nroFactura());
            facturaIngresoRepository.save(factura);
        }

        return resultados;
    }

    // ── Listar historial ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<FacturaIngreso> listar(int page, int size) {
        return facturaIngresoRepository.findAllOrdenadas(PageRequest.of(page, size));
    }
}
