package com.ferromax.erp.service;

import com.ferromax.erp.dto.DashboardDTO;
import com.ferromax.erp.dto.VentaDiariaDTO;
import com.ferromax.erp.dto.VentaResponse;
import com.ferromax.erp.model.EstadoPedidoEnum;
import com.ferromax.erp.model.EstadoVentaEnum;
import com.ferromax.erp.model.MedioPagoEnum;
import com.ferromax.erp.model.Venta;
import com.ferromax.erp.repository.PedidoRepository;
import com.ferromax.erp.repository.ProductoRepository;
import com.ferromax.erp.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final ZoneId ZONA_AR = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final int DIAS_SEMANA = 7;
    private static final List<EstadoPedidoEnum> ESTADOS_ACTIVOS =
            List.of(EstadoPedidoEnum.PENDIENTE, EstadoPedidoEnum.CONFIRMADO);

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;
    private final PedidoRepository pedidoRepository;

    @Transactional(readOnly = true)
    public DashboardDTO obtenerResumen() {
        OffsetDateTime[] hoy = inicioYFinDeHoy();

        BigDecimal ventasHoy = ventaRepository.sumTotalByFechaAndEstado(
                hoy[0], hoy[1], EstadoVentaEnum.COMPLETADA);

        int cantidadVentasHoy = ventaRepository.countByFechaAndEstado(
                hoy[0], hoy[1], EstadoVentaEnum.COMPLETADA);

        int productosStockCritico = productoRepository.findProductosConStockCritico().size();

        int pedidosPendientes = pedidoRepository.countByEstadoIn(ESTADOS_ACTIVOS);

        BigDecimal saldoCaja = ventaRepository.sumTotalByFechaAndEstadoAndMedioPago(
                hoy[0], hoy[1], EstadoVentaEnum.COMPLETADA, MedioPagoEnum.EFECTIVO);

        return new DashboardDTO(ventasHoy, cantidadVentasHoy, productosStockCritico,
                pedidosPendientes, saldoCaja);
    }

    @Transactional(readOnly = true)
    public List<VentaDiariaDTO> ventasUltimos7Dias() {
        List<VentaDiariaDTO> resultado = new ArrayList<>();
        LocalDate hoy = LocalDate.now(ZONA_AR);

        for (int i = DIAS_SEMANA - 1; i >= 0; i--) {
            LocalDate dia = hoy.minusDays(i);
            OffsetDateTime inicio = dia.atStartOfDay(ZONA_AR).toOffsetDateTime();
            OffsetDateTime fin = dia.plusDays(1).atStartOfDay(ZONA_AR).toOffsetDateTime();

            BigDecimal total = ventaRepository.sumTotalByFechaAndEstado(
                    inicio, fin, EstadoVentaEnum.COMPLETADA);

            resultado.add(new VentaDiariaDTO(dia, total));
        }

        return resultado;
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> ultimasTransacciones(int cantidad) {
        return ventaRepository
                .findAllByOrderByFechaDesc(PageRequest.of(0, cantidad))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private OffsetDateTime[] inicioYFinDeHoy() {
        LocalDate hoy = LocalDate.now(ZONA_AR);
        return new OffsetDateTime[]{
                hoy.atStartOfDay(ZONA_AR).toOffsetDateTime(),
                hoy.plusDays(1).atStartOfDay(ZONA_AR).toOffsetDateTime()
        };
    }

    private VentaResponse toResponse(Venta venta) {
        String nombreCajero = venta.getCajero().getNombre()
                + " " + venta.getCajero().getApellido();
        String origen = venta.getOrigen() != null ? venta.getOrigen().name() : "POS";
        return new VentaResponse(
                venta.getId(),
                venta.getFecha(),
                venta.getTotal(),
                venta.getEstado().name(),
                venta.getMedioPago().name(),
                nombreCajero.strip(),
                venta.getItems().size(),
                origen
        );
    }
}
