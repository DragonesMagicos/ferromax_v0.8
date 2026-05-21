package com.ferromax.erp.service;

import com.ferromax.erp.dto.AlertaStockDTO;
import com.ferromax.erp.exception.RecursoNoEncontradoException;
import com.ferromax.erp.model.AlertaStock;
import com.ferromax.erp.repository.AlertaStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AlertaService {

    private static final ZoneId ZONA_AR = ZoneId.of("America/Argentina/Buenos_Aires");

    private final AlertaStockRepository alertaStockRepository;

    @Transactional(readOnly = true)
    public List<AlertaStockDTO> listarNoLeidas() {
        return alertaStockRepository.findByLidaFalseOrderByFechaGeneracionDesc()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaStockDTO> listarUltimos30Dias() {
        OffsetDateTime desde = OffsetDateTime.now(ZONA_AR).minusDays(30);
        return alertaStockRepository.findByFechaGeneracionAfterOrderByFechaGeneracionDesc(desde)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public AlertaStockDTO marcarLeida(Long id) {
        AlertaStock alerta = alertaStockRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("AlertaStock", id));
        alerta.setLida(true);
        return toDTO(alertaStockRepository.save(alerta));
    }

    @Transactional
    public Map<String, Integer> marcarTodasLeidas() {
        List<AlertaStock> pendientes = alertaStockRepository.findByLidaFalse();
        pendientes.forEach(a -> a.setLida(true));
        alertaStockRepository.saveAll(pendientes);
        return Map.of("marcadas", pendientes.size());
    }

    private AlertaStockDTO toDTO(AlertaStock a) {
        return new AlertaStockDTO(
                a.getId(),
                a.getProducto().getNombre(),
                a.getProducto().getStockActual(),
                a.getProducto().getStockMinimo(),
                a.getAlertaEnum(),
                a.getFechaGeneracion(),
                a.getLida()
        );
    }
}
