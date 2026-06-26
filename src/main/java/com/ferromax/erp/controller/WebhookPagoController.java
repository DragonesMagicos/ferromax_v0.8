package com.ferromax.erp.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;

/**
 * Recibe notificaciones de pago de la pasarela externa.
 *
 * SEGURIDAD: cada request debe incluir una firma HMAC-SHA256 del raw body
 * en el header X-Webhook-Signature. Si la firma no coincide, la request
 * se rechaza con 401 y nunca se procesa.
 *
 * Para MercadoPago el header es "x-signature"; para Stripe es "Stripe-Signature".
 * Ajustar el nombre del header según la pasarela elegida.
 */
@Slf4j
@RestController
@RequestMapping("/webhook/pago")
@RequiredArgsConstructor
public class WebhookPagoController {

    @Value("${webhook.secret}")
    private String webhookSecret;

    /**
     * Endpoint principal. Recibe el body como bytes para poder calcular
     * el HMAC sobre el payload sin deserializar (deserializar primero
     * podría alterar la representación y romper la firma).
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> recibirNotificacion(
            @RequestHeader(value = "X-Webhook-Signature", required = false) String firmaHeader,
            HttpServletRequest request) throws IOException {

        // Leer raw body antes de cualquier deserialización
        byte[] rawBody = request.getInputStream().readAllBytes();

        // 1 — Rechazar si no hay firma
        if (firmaHeader == null || firmaHeader.isBlank()) {
            log.warn("Webhook recibido sin firma desde IP={}", request.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "FIRMA_REQUERIDA", "mensaje", "Header X-Webhook-Signature ausente"));
        }

        // 2 — Validar firma
        if (!firmaValida(rawBody, firmaHeader)) {
            log.warn("Firma de webhook inválida desde IP={} — posible intento de spoofing", request.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "FIRMA_INVALIDA", "mensaje", "La firma del webhook no coincide"));
        }

        // 3 — Procesar el evento (implementar según la pasarela)
        String payload = new String(rawBody, StandardCharsets.UTF_8);
        log.info("Webhook de pago recibido y verificado. Longitud payload={}", rawBody.length);

        procesarEvento(payload);

        return ResponseEntity.ok(Map.of("status", "recibido"));
    }

    /**
     * Compara la firma del header con el HMAC-SHA256 calculado sobre el raw body.
     * Usa MessageDigest.isEqual (tiempo constante) para evitar timing attacks.
     *
     * El header puede venir como "sha256=<hex>" (estilo GitHub/Stripe) o solo "<hex>".
     */
    private boolean firmaValida(byte[] rawBody, String firmaHeader) {
        try {
            String firmaRecibida = firmaHeader.startsWith("sha256=")
                    ? firmaHeader.substring(7)
                    : firmaHeader;

            byte[] firmaEsperada = calcularHmac(rawBody, webhookSecret);
            byte[] firmaCliente = HexFormat.of().parseHex(firmaRecibida);

            // Comparación en tiempo constante — evita timing attacks
            return MessageDigest.isEqual(firmaEsperada, firmaCliente);

        } catch (IllegalArgumentException e) {
            // firmaRecibida no es hex válido
            log.debug("Firma de webhook con formato inválido: {}", e.getMessage());
            return false;
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Error al calcular HMAC del webhook: {}", e.getMessage(), e);
            return false;
        }
    }

    private byte[] calcularHmac(byte[] data, String secret)
            throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        return mac.doFinal(data);
    }

    /**
     * Procesar el evento de pago.
     * Expandir según los tipos de evento de la pasarela elegida:
     * "payment.approved", "payment.rejected", "refund.created", etc.
     */
    private void procesarEvento(String payload) {
        // TODO: deserializar payload, identificar tipo de evento,
        //       actualizar estado de orden/venta en la BD.
        log.info("Procesando evento de webhook (implementación pendiente)");
    }
}
