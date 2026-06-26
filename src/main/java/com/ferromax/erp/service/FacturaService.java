package com.ferromax.erp.service;

import com.ferromax.erp.dto.*;
import com.ferromax.erp.model.*;
import com.ferromax.erp.repository.FacturaIngresoRepository;
import com.ferromax.erp.repository.ProductoRepository;
import com.ferromax.erp.repository.ProveedorRepository;
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
// PageRequest usado en listar()
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
    private final ProveedorRepository proveedorRepository;

    @Value("${ocr.space.api.key}")
    private String ocrSpaceApiKey;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    // ── Extracción de texto ────────────────────────────────────────────────────

    @Transactional
    public FacturaAnalisisResponse analizarFactura(MultipartFile archivo, Long usuarioId) {
        try {
            String contentType = archivo.getContentType() != null ? archivo.getContentType() : "";
            String texto;

            if (contentType.equals("application/pdf")) {
                // PDFBox extrae bien los ítems (texto seleccionable)
                // OCR.space captura el encabezado gráfico (logo, nombre, CUIT del emisor)
                String textoPdf = extraerTextoPDF(archivo);
                String textoOcr = extraerTextoImagen(archivo);
                texto = (textoOcr.isBlank() ? "" : textoOcr + "\n") + textoPdf;
            } else {
                // Para imágenes: Gemini Vision como fuente principal, OCR.space como fallback
                String textoGemini = extraerTextoConGemini(archivo);
                if (!textoGemini.isBlank()) {
                    texto = textoGemini;
                    log.info("Usando Gemini Vision para extracción de texto");
                } else {
                    log.warn("Gemini no devolvió texto, usando OCR.space como fallback");
                    texto = extraerTextoImagen(archivo);
                }
            }

            log.debug("=== TEXTO EXTRAÍDO DEL DOCUMENTO ===\n{}\n=== FIN TEXTO ===", texto);
            try {
                java.nio.file.Files.writeString(
                    java.nio.file.Path.of("ocr-debug.txt"),
                    texto, java.nio.charset.StandardCharsets.UTF_8
                );
            } catch (Exception ignored) {}

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

            if (conMatch.proveedorId() != null) {
                proveedorRepository.findById(conMatch.proveedorId())
                        .ifPresent(factura::setProveedor);
            }

            FacturaIngreso guardada = facturaIngresoRepository.save(factura);
            log.info("Factura borrador guardada con ID {}", guardada.getId());

            return new FacturaAnalisisResponse(
                    conMatch.proveedor(), conMatch.cuitProveedor(), conMatch.proveedorId(),
                    conMatch.numeroFactura(), conMatch.items(), guardada.getId()
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
            byte[] fileBytes = archivo.getBytes();
            String mimeType = archivo.getContentType() != null ? archivo.getContentType() : "image/jpeg";
            // Usar el nombre real del archivo para que OCR.space detecte la extensión correctamente
            String filename = archivo.getOriginalFilename() != null ? archivo.getOriginalFilename() : "documento.jpg";
            String boundary = "----FormBoundary" + System.currentTimeMillis();
            byte[] CRLF = "\r\n".getBytes(java.nio.charset.StandardCharsets.UTF_8);

            // Construir el body como bytes para evitar un String gigante con el base64
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            // apikey
            out.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"apikey\"\r\n\r\n" + ocrSpaceApiKey + "\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
            // language
            out.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"language\"\r\n\r\nspa\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
            // isTable
            out.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"isTable\"\r\n\r\ntrue\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
            // OCREngine 2
            out.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"OCREngine\"\r\n\r\n2\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
            // file — bytes crudos con nombre real (OCR.space necesita la extensión para detectar el tipo)
            out.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\nContent-Type: " + mimeType + "\r\n\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
            out.write(fileBytes);
            out.write(CRLF);
            out.write(("--" + boundary + "--\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.ocr.space/parse/image"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(out.toByteArray()))
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

    private String extraerTextoConGemini(MultipartFile archivo) {
        try {
            byte[] bytes = archivo.getBytes();
            String mimeType = archivo.getContentType() != null ? archivo.getContentType() : "image/jpeg";
            String base64 = Base64.getEncoder().encodeToString(bytes);

            String prompt = "Sos un extractor de facturas. Analizá esta imagen de factura y extraé TODOS los ítems/productos. "
                + "Devolvé ÚNICAMENTE los ítems en este formato, una línea por ítem (sin encabezado, sin texto extra): "
                + "CODIGO|CANTIDAD|DESCRIPCION|PRECIO_UNITARIO\\n"
                + "Si algún campo no existe en la factura ponelo vacío. "
                + "También incluí al inicio (antes de los ítems) estas líneas si las encontrás: "
                + "CUIT: xx-xxxxxxxx-x\\nPROVEEDOR: nombre\\nNUMERO_FACTURA: nro";

            String body = "{"
                + "\"contents\":[{\"parts\":["
                + "{\"text\":" + jsonStr(prompt) + "},"
                + "{\"inline_data\":{\"mime_type\":\"" + mimeType + "\",\"data\":\"" + base64 + "\"}}"
                + "]}],"
                + "\"generationConfig\":{\"temperature\":0,\"maxOutputTokens\":2048}"
                + "}";

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            log.info("Gemini status: {}", resp.statusCode());

            if (resp.statusCode() != 200) {
                log.warn("Gemini error: {}", resp.body().substring(0, Math.min(300, resp.body().length())));
                return "";
            }

            // Extraer el texto de la respuesta JSON de Gemini
            String respBody = resp.body();
            int textIdx = respBody.indexOf("\"text\":");
            if (textIdx < 0) { log.warn("Gemini: sin campo text"); return ""; }
            int strStart = respBody.indexOf('"', textIdx + 7) + 1;
            if (strStart <= 0) return "";
            StringBuilder sb = new StringBuilder();
            int i = strStart;
            while (i < respBody.length()) {
                char c = respBody.charAt(i);
                if (c == '"') break;
                if (c == '\\' && i + 1 < respBody.length()) {
                    char esc = respBody.charAt(i + 1);
                    switch (esc) {
                        case 'n'  -> { sb.append('\n'); i += 2; continue; }
                        case 'r'  -> { i += 2; continue; }
                        case 't'  -> { sb.append('\t'); i += 2; continue; }
                        case '"'  -> { sb.append('"');  i += 2; continue; }
                        case '\\' -> { sb.append('\\'); i += 2; continue; }
                        default   -> { sb.append(esc);  i += 2; continue; }
                    }
                }
                sb.append(c);
                i++;
            }
            String resultado = sb.toString().trim();
            log.info("Gemini extrajo {} caracteres:\n{}", resultado.length(), resultado);
            return resultado;

        } catch (Exception e) {
            log.warn("Error Gemini: {}", e.getMessage());
            return "";
        }
    }

    private static String jsonStr(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
    }

    // ── Parsing ────────────────────────────────────────────────────────────────

    // CUIT precedido por etiqueta explícita "C.U.I.T." — identifica al VENDEDOR
    private static final Pattern PATRON_CUIT_ETIQUETA = Pattern.compile(
        "(?i)C\\.?U\\.?I\\.?T\\.?[:\\s]+\\s*(\\d{2}-\\d{8}-\\d)"
    );
    // Fallback: cualquier CUIT en el texto
    private static final Pattern PATRON_CUIT = Pattern.compile("\\b(\\d{2}-\\d{8}-\\d)\\b");

    // Palabras que indican que una línea pertenece al comprador, no al proveedor
    private static final Set<String> PALABRAS_COMPRADOR = Set.of(
        "señor", "señores", "sr.", "sra.", "cliente", "comprador", "destinatario",
        "av.", "avda.", "calle", "piso", "dto", "dpto", "capital federal",
        "buenos aires", "córdoba", "rosario", "responsable inscripto", "consumidor final",
        "monotributista", "exento", "propio", "condicion"
    );

    private FacturaAnalisisResponse parsearTexto(String texto) {
        String[] lineas = texto.split("\\r?\\n");

        String cuit = detectarCuit(texto);
        Proveedor proveedor = cuit != null ? proveedorRepository.findByRuc(cuit).orElse(null) : null;
        String nombreProveedor;
        if (proveedor != null) {
            nombreProveedor = proveedor.getNombre();
        } else if (cuit != null) {
            // CUIT detectado pero no registrado: detectar nombre del encabezado sin crear el proveedor
            nombreProveedor = detectarNombreCercaDelCuit(lineas, cuit);
            log.info("CUIT {} no registrado en el sistema, se sugiere al usuario", cuit);
        } else {
            nombreProveedor = null;
        }
        Long proveedorId = proveedor != null ? proveedor.getId() : null;

        log.info("CUIT detectado: {} | Proveedor: {}{}", cuit, nombreProveedor, proveedorId != null ? " (registrado)" : "");

        // Limpiar prefijo "PROVEEDOR:" que agrega Gemini
        if (nombreProveedor != null && nombreProveedor.toUpperCase().startsWith("PROVEEDOR:")) {
            nombreProveedor = nombreProveedor.substring(nombreProveedor.indexOf(':') + 1).trim();
        }

        String numeroFactura = detectarNumeroFactura(texto);
        List<ItemFacturaDTO> items = extraerItems(lineas);

        return new FacturaAnalisisResponse(nombreProveedor, cuit, proveedorId, numeroFactura, items, null);
    }

    private String detectarCuit(String texto) {
        // Solo buscar CUIT con etiqueta explícita "C.U.I.T.:" → identifica al vendedor
        // Un CUIT sin etiqueta casi siempre es el del comprador — no lo usamos
        Matcher m = PATRON_CUIT_ETIQUETA.matcher(texto);
        return m.find() ? m.group(1) : null;
    }

    // Sufijos legales de empresas argentinas
    private static final Pattern PATRON_RAZON_SOCIAL = Pattern.compile(
        "(?i)\\b(S\\.?A\\.?|S\\.?R\\.?L\\.?|S\\.?A\\.?S\\.?|S\\.?C\\.?|S\\.?H\\.?|LTDA\\.?)\\b"
    );

    private String detectarNombreCercaDelCuit(String[] lineas, String cuit) {
        // Estrategia 1: buscar una línea que contenga razón social (S.A., S.R.L., etc.)
        // Solo en los primeros 40% de líneas (encabezado de la factura)
        int limiteHeader = Math.max(10, lineas.length * 2 / 5);
        for (int i = 0; i < limiteHeader; i++) {
            String linea = lineas[i];
            if (linea.trim().length() < 4) continue;
            // Dividir por tabuladores: el nombre puede estar en un segmento junto a "FACTURA ..."
            String[] segmentos = linea.split("\\t");
            for (String seg : segmentos) {
                String s = seg.trim();
                if (s.length() < 4 || s.length() > 120) continue;
                if (!PATRON_RAZON_SOCIAL.matcher(s).find()) continue;
                String sLow = s.toLowerCase();
                if (sLow.contains("@") || sLow.contains("www.") || sLow.contains("cuit")
                        || sLow.contains("factura") || sLow.contains("remito")) continue;
                if (PALABRAS_COMPRADOR.stream().anyMatch(sLow::contains)) continue;
                log.debug("Nombre proveedor por razón social (línea {}, segmento): {}", i, s);
                return s;
            }
        }

        // Estrategia 2: buscar en las líneas ALREDEDOR de la etiqueta "C.U.I.T." o "CUIT:"
        // (no solo antes, porque en facturas de 2 columnas el nombre puede estar en la misma línea)
        int lineaCuitLabel = -1;
        for (int i = 0; i < lineas.length; i++) {
            String lLow = lineas[i].toLowerCase();
            if ((lLow.contains("c.u.i.t") || lLow.contains("cuit:") || lLow.contains("cuit "))
                    && lineas[i].contains(cuit)) {
                lineaCuitLabel = i; break;
            }
        }
        if (lineaCuitLabel < 0) {
            // fallback: línea que solo contiene el CUIT
            for (int i = 0; i < lineas.length; i++) {
                if (lineas[i].contains(cuit)) { lineaCuitLabel = i; break; }
            }
        }
        if (lineaCuitLabel < 0) return null;

        // Buscar en las 6 líneas anteriores a la etiqueta CUIT
        for (int i = lineaCuitLabel - 1; i >= Math.max(0, lineaCuitLabel - 6); i--) {
            String l = lineas[i].trim();
            if (l.length() < 3 || l.length() > 120) continue;
            if (l.matches("[\\d\\-\\.\\s/]+")) continue;
            if (l.matches(".*\\d{2}/\\d{2}/\\d{4}.*")) continue;
            if (l.matches("\\d{4}-\\d+")) continue;
            long letras = l.chars().filter(Character::isLetter).count();
            if (letras < 3) continue;
            String lLow = l.toLowerCase();
            if (lLow.contains("cuit") || lLow.contains("factura") || lLow.contains("fecha")
                    || lLow.contains("@") || lLow.contains("www.")
                    || lLow.contains("tel") || lLow.contains("fax")) continue;
            if (PALABRAS_COMPRADOR.stream().anyMatch(lLow::contains)) continue;
            log.debug("Nombre proveedor cerca de etiqueta CUIT (línea {}): {}", i, l);
            return l;
        }
        return null;
    }

    private String detectarNumeroFactura(String texto) {
        Pattern[] patrones = {
            // Formato Gemini: "NUMERO_FACTURA: 001-001-001307787"
            Pattern.compile("(?i)numero_factura\\s*:\\s*([\\d]{3,5}-[\\d]{3,5}-[\\d]{6,12})"),
            // Tres partes: "NO. 001-001-001307787" o "N° 001-001-001307787"
            Pattern.compile("(?i)n[o°]\\.?\\s*([\\d]{3,5}-[\\d]{3,5}-[\\d]{6,12})"),
            // Formato argentino dos partes: "Factura N° 0001-00012345"
            Pattern.compile("(?i)factura\\s*[n°nro\\.]*\\s*(\\d{4,5}-\\d{6,8})"),
            Pattern.compile("(?i)(?:factura|fact\\.?)\\s*(?:n[°ro\\.]*)?\\s*(\\d{4,5}-\\d+)"),
            Pattern.compile("(?i)n[°o]\\.?\\s*(\\d{4,5}-\\d{4,})"),
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

        // Precio argentino: admite separador de miles (1.234,56) y formato simple (123,45 / 123.45)
        Pattern pPrecio = Pattern.compile("\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d{1,7}[.,]\\d{2}");

        boolean dentroDeTabla = false;
        boolean formatoCodigoCantidadDesc = false;
        // Estado para reconstruir ítems fragmentados en múltiples líneas
        String codigoPendiente = null;
        String descPendiente   = null;

        for (String linea : lineas) {
            try {
            String l = linea.trim()
                .replace("|", " ").replace("[", " ").replace("]", " ")
                .replace("—", " ").replace(")", " ")
                .replaceAll("[ \\t]+", " ").trim();

            if (l.isEmpty() || l.length() < 2 || l.length() > 200) continue;

            String lLower = l.toLowerCase();

            // Detectar cabecera de tabla
            if (lLower.contains("descrip") || lLower.contains("unidad") || lLower.contains("p.unitario")
                    || (lLower.contains("codigo") && lLower.contains("cantidad"))) {
                dentroDeTabla = true;
                int iCodH  = lLower.indexOf("codigo");
                int iCantH = lLower.indexOf("cantidad");
                int iDescH = lLower.indexOf("descrip");
                if (iCodH >= 0 && iCantH > iCodH && (iDescH < 0 || iDescH > iCantH)) {
                    formatoCodigoCantidadDesc = true;
                    log.info("Formato detectado: CODIGO | CANTIDAD | DESCRIPCION");
                }
                continue;
            }
            // Filtrar totales y pie
            if (lLower.startsWith("total") || lLower.startsWith("subtotal") || lLower.startsWith("iva")) {
                codigoPendiente = null; descPendiente = null; continue;
            }
            boolean esNoItem = PALABRAS_NO_ITEM.stream().anyMatch(kw ->
                lLower.equals(kw) || lLower.startsWith(kw + " ") || lLower.startsWith(kw + ":"));
            if (esNoItem) { codigoPendiente = null; descPendiente = null; continue; }

            String[] tok = l.split(" ");

            // ── Modo multi-línea: la línea tiene SOLO un código de producto ────────
            // Ej: "M1-CNS26487" solo — la cantidad viene en la siguiente línea
            if (tok.length == 1 && PATRON_SKU.matcher(tok[0]).matches()) {
                codigoPendiente = tok[0].toUpperCase();
                descPendiente   = null;
                log.debug("Código pendiente detectado: {}", codigoPendiente);
                continue;
            }

            // ── Si hay un código pendiente, intentar extraer cant+precio de esta línea ─
            if (codigoPendiente != null) {
                // Buscar el primer número entero como cantidad
                int cant = 0;
                double precio = 0.0;
                String desc = descPendiente != null ? descPendiente : codigoPendiente;
                for (int i = 0; i < tok.length; i++) {
                    String t = tok[i].replaceAll("[.,]\\d+$", "").replaceAll("[^\\d]", "");
                    if (!t.isEmpty() && cant == 0) {
                        try {
                            int v = Integer.parseInt(t);
                            if (v > 0 && v <= 9999) { cant = v; continue; }
                        } catch (Exception ignored) {}
                    }
                    if (pPrecio.matcher(tok[i]).matches() && precio == 0.0) {
                        precio = parsearDecimal(tok[i]);
                    }
                }
                if (cant > 0) {
                    log.debug("Ítem multi-línea: {} | SKU:{} | cant:{} | precio:{}", desc, codigoPendiente, cant, precio);
                    items.add(new ItemFacturaDTO(desc, codigoPendiente, cant, precio, null, null));
                    codigoPendiente = null; descPendiente = null;
                    continue;
                }
                // Si la línea tiene texto (descripción), guardarla y seguir esperando cantidad
                if (tok.length >= 1 && l.chars().filter(Character::isLetter).count() > 3) {
                    descPendiente = l;
                }
                continue;
            }

            // ── Parseo normal línea completa ─────────────────────────────────────
            if (tok.length < 2) continue;
            ItemFacturaDTO item = parsearTokens(tok, pPrecio, dentroDeTabla, formatoCodigoCantidadDesc);
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

    // Regex de código de producto: alfanumérico con guiones opcionales (ej: j111, HE-879032, M1-CNS26487)
    private static final Pattern PATRON_SKU = Pattern.compile(
        "^[A-Za-z][A-Za-z0-9]{0,4}[-]?[A-Za-z0-9]{2,10}$"
    );

    // Parseo basado en tokens — evita backtracking catastrófico de regex complejos
    private ItemFacturaDTO parsearTokens(String[] tok, Pattern pPrecio, boolean dentroDeTabla, boolean formatoCodCantDesc) {
        int n = tok.length;

        // Identificar código al inicio — regex ampliado para incluir formatos con guión (HE-879032, M1-CNS26487)
        int iCod = -1;
        if (PATRON_SKU.matcher(tok[0]).matches()) iCod = 0;
        // fallback original para códigos sin guión
        if (iCod < 0 && tok[0].matches("[A-Za-z]{1,4}\\d{2,6}[A-Za-z]?")) iCod = 0;

        if (iCod >= 0) {

            // ── Formato CODIGO | CANTIDAD | DESCRIPCION [PRECIO] ──────────────
            if (formatoCodCantDesc && n >= 3) {
                // tok[0]=SKU, tok[1]=cantidad, tok[2..]=descripción [último=precio opcional]
                String cantStr1 = tok[1].replaceAll("[.,]\\d+$", "").replaceAll("[^\\d]", "");
                if (!cantStr1.isEmpty()) {
                    try {
                        int cant1 = Integer.parseInt(cantStr1);
                        if (cant1 > 0 && cant1 <= 9999) {
                            int iUltimo = n - 1;
                            double precio1 = 0.0;
                            int descHasta = n;
                            if (pPrecio.matcher(tok[iUltimo]).matches()) {
                                precio1 = parsearDecimal(tok[iUltimo]);
                                descHasta = iUltimo;
                            }
                            if (descHasta <= 2) return null;
                            String desc1 = String.join(" ", Arrays.copyOfRange(tok, 2, descHasta)).trim();
                            if (desc1.isBlank()) desc1 = tok[0].toUpperCase(); // usar el código como desc si no hay
                            if (esFalsoPositivo(desc1)) return null;
                            return new ItemFacturaDTO(desc1, tok[0].toUpperCase(), cant1, precio1, null, null);
                        }
                    } catch (Exception ignored) {}
                }
            }

            // ── Formato SKU | DESCRIPCION... | CANT [IVA] PRECIO [TOTAL] ──────
            // Las últimas columnas son todas numéricas — detectar el bloque trailing
            int iBloqueComienzo = n;
            for (int i = n - 1; i >= 1; i--) {
                if (pPrecio.matcher(tok[i]).matches()) iBloqueComienzo = i;
                else break;
            }
            if (iBloqueComienzo >= n) return null;

            int bloqueSize = n - iBloqueComienzo;
            // primer token del bloque = cantidad (viene como "24.00", "5.00", etc.)
            int iCant = iBloqueComienzo;
            // precio unitario: si hay >=3 tokens en bloque → penúltimo; si hay 2 → último
            int iPrecio = bloqueSize >= 3 ? n - 2 : (bloqueSize == 2 ? n - 1 : -1);
            if (iPrecio < 0 && !dentroDeTabla) return null;

            // descripción entre el SKU y el bloque numérico
            if (1 >= iBloqueComienzo) return null;
            String desc = String.join(" ", Arrays.copyOfRange(tok, 1, iBloqueComienzo)).trim();
            if (desc.length() < 3 || esFalsoPositivo(desc)) return null;

            // parsear cantidad (puede venir como "24.00" → 24)
            String cantStr = tok[iCant].replaceAll("[.,]\\d+$", "");
            int cant;
            try { cant = Integer.parseInt(cantStr); if (cant <= 0 || cant > 9999) return null; }
            catch (Exception e) { return null; }

            double precio = iPrecio >= 0 ? parsearDecimal(tok[iPrecio]) : 0.0;
            if (precio <= 0 && !dentroDeTabla) return null;

            return new ItemFacturaDTO(desc, tok[iCod].toUpperCase(), cant, precio, null, null);

        } else {
            // Formato sin SKU: [CANT] DESCRIPCION [PRECIO]
            int iPrecio = -1;
            for (int i = n - 1; i >= 1; i--) {
                if (pPrecio.matcher(tok[i]).matches()) { iPrecio = i; break; }
            }

            int iCant = -1;
            for (int i = 0; i < n; i++) {
                // acepta entero puro o N.00 / N,00
                String t = tok[i].replaceAll("[.,]0+$", "");
                if (t.matches("\\d{1,4}")) {
                    int v = Integer.parseInt(t);
                    if (v > 0 && v <= 9999) { iCant = i; break; }
                }
            }
            if (iCant < 0) return null;

            int descDesde = iCant + 1;
            int descHasta = iPrecio >= 0 ? iPrecio : n;
            if (descDesde >= descHasta) return null;

            String desc = String.join(" ", Arrays.copyOfRange(tok, descDesde, descHasta)).trim();
            if (desc.length() < 3 || esFalsoPositivo(desc)) return null;

            String cantStr = tok[iCant].replaceAll("[.,]0+$", "");
            int cant;
            try { cant = Integer.parseInt(cantStr); if (cant <= 0 || cant > 9999) return null; }
            catch (Exception e) { return null; }

            double precio = iPrecio >= 0 ? parsearDecimal(tok[iPrecio]) : 0.0;
            if (precio <= 0 && !dentroDeTabla) return null;

            return new ItemFacturaDTO(desc, null, cant, precio, null, null);
        }
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

        return new FacturaAnalisisResponse(analisis.proveedor(), analisis.cuitProveedor(), analisis.proveedorId(), analisis.numeroFactura(), matcheados, null);
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

            if (request.proveedorId() != null) {
                // Proveedor ya existe: vincular
                proveedorRepository.findById(request.proveedorId()).ifPresent(factura::setProveedor);
            } else if (request.proveedor() != null && !request.proveedor().isBlank()) {
                // Proveedor nuevo: crear automáticamente
                String cuit = request.cuitProveedor();
                Proveedor prov = (cuit != null && !cuit.isBlank())
                        ? proveedorRepository.findByRuc(cuit).orElse(null)
                        : null;
                if (prov == null) {
                    prov = new Proveedor();
                    prov.setNombre(request.proveedor().trim());
                    if (cuit != null && !cuit.isBlank()) prov.setRuc(cuit.trim());
                    prov = proveedorRepository.save(prov);
                    log.info("Proveedor '{}' creado automáticamente desde factura", prov.getNombre());
                }
                factura.setProveedor(prov);
            }

            facturaIngresoRepository.save(factura);
        }

        return resultados;
    }

    // ── Listar historial ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<FacturaIngresoResumenDTO> listar(int page, int size) {
        // El mapeo a DTO se hace dentro de la transacción para que la colección LAZY items
        // pueda resolverse antes de que se cierre la sesión JPA
        return facturaIngresoRepository.findAllOrdenadas(PageRequest.of(page, size))
                .map(FacturaIngresoResumenDTO::from);
    }
}
