package com.ferromax.erp.util;

import ch.qos.logback.classic.pattern.ClassicConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;

import java.util.regex.Pattern;

/**
 * Logback converter que enmascara PANs y CVVs en cualquier mensaje de log.
 * Registrado en logback-spring.xml como %msg reemplazado por %maskedMsg.
 *
 * PAN: 13-19 dígitos, opcionalmente separados por espacios o guiones.
 * CVV: 3-4 dígitos precedidos por keyword cvv/cvc/security.
 */
public class PanMaskingConverter extends ClassicConverter {

    // 13-19 dígitos con separadores opcionales (Visa, MC, Amex, etc.)
    private static final Pattern PAN_PATTERN = Pattern.compile(
            "\\b(?:\\d[ \\-]?){12,18}\\d\\b"
    );

    // CVV/CVC: 3-4 dígitos cerca de palabras clave
    private static final Pattern CVV_PATTERN = Pattern.compile(
            "(?i)(?:cvv|cvc|security[_\\s]?code)[=:\\s\"']+([0-9]{3,4})"
    );

    @Override
    public String convert(ILoggingEvent event) {
        String mensaje = event.getFormattedMessage();
        if (mensaje == null) return "";

        mensaje = PAN_PATTERN.matcher(mensaje).replaceAll(m -> maskPan(m.group()));
        mensaje = CVV_PATTERN.matcher(mensaje).replaceAll(m ->
                m.group().replaceAll("[0-9]{3,4}$", "***"));

        return mensaje;
    }

    /** Conserva los últimos 4 dígitos: 4111111111111111 → ************1111 */
    private String maskPan(String pan) {
        String digitsOnly = pan.replaceAll("[^0-9]", "");
        if (digitsOnly.length() < 4) return "****";
        return "*".repeat(digitsOnly.length() - 4) + digitsOnly.substring(digitsOnly.length() - 4);
    }
}
