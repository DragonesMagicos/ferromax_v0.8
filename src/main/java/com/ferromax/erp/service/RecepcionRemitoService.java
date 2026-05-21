package com.ferromax.erp.service;

import com.ferromax.erp.dto.ConfirmarRemitoRequest;
import com.ferromax.erp.dto.RecepcionRemitoRequest;
import com.ferromax.erp.dto.RecepcionRemitoResponse;
import com.ferromax.erp.exception.RecursoNoEncontradoException;
import com.ferromax.erp.model.*;
import com.ferromax.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecepcionRemitoService {

    private final RecepcionRemitoRepository remitoRepository;
    private final ProveedorRepository proveedorRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoStockRepository movimientoStockRepository;

    // ── Empleado: crear encabezado de remito ─────────────────────────────────

    @Transactional
    public RecepcionRemitoResponse crearRemito(RecepcionRemitoRequest request, Long empleadoId) {
        Proveedor proveedor = proveedorRepository.findById(request.proveedorId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Proveedor", request.proveedorId()));

        Usuario empleado = usuarioRepository.findById(empleadoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", empleadoId));

        RecepcionRemito remito = new RecepcionRemito();
        remito.setProveedor(proveedor);
        remito.setNumeroRemito(request.numeroRemito().trim());
        remito.setEmpleado(empleado);
        remito.setEstado(EstadoRecepcionEnum.PENDIENTE);
        remito.setNotas(request.notas());

        remitoRepository.save(remito);
        return toResponse(remito);
    }

    // ── Empleado: listar sus propios remitos ──────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecepcionRemitoResponse> listarMisRemitos(Long empleadoId) {
        return remitoRepository.findByEmpleadoIdOrderByCreatedAtDesc(empleadoId)
                .stream().map(this::toResponse).toList();
    }

    // ── Admin: listar remitos pendientes ──────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecepcionRemitoResponse> listarPendientes() {
        return remitoRepository.findByEstadoOrderByCreatedAtDesc(EstadoRecepcionEnum.PENDIENTE)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RecepcionRemitoResponse> listarTodos() {
        return remitoRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse).toList();
    }

    // ── Obtener detalle ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RecepcionRemitoResponse obtenerDetalle(Long remitoId) {
        RecepcionRemito remito = remitoRepository.findByIdConDetalle(remitoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("RecepcionRemito", remitoId));
        return toResponseConItems(remito);
    }

    // ── Admin: confirmar o rechazar ───────────────────────────────────────────

    @Transactional
    public RecepcionRemitoResponse confirmar(Long remitoId, ConfirmarRemitoRequest request, Long adminId) {
        RecepcionRemito remito = remitoRepository.findById(remitoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("RecepcionRemito", remitoId));

        if (remito.getEstado() != EstadoRecepcionEnum.PENDIENTE) {
            throw new IllegalStateException("El remito ya fue procesado (estado: " + remito.getEstado() + ")");
        }

        Usuario admin = usuarioRepository.findById(adminId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", adminId));

        remito.setAdmin(admin);
        remito.setNotasAdmin(request.notasAdmin());
        remito.setConfirmadoAt(OffsetDateTime.now());
        remito.setEstado(request.aprobar() ? EstadoRecepcionEnum.CONFIRMADO : EstadoRecepcionEnum.RECHAZADO);

        remitoRepository.save(remito);
        return toResponseConItems(remito);
    }

    // ── Mapeo a DTO ───────────────────────────────────────────────────────────

    private RecepcionRemitoResponse toResponse(RecepcionRemito r) {
        return new RecepcionRemitoResponse(
                r.getId(),
                r.getProveedor().getId(),
                r.getProveedor().getNombre(),
                r.getNumeroRemito(),
                r.getEstado(),
                r.getEmpleado().getNombre(),
                r.getAdmin() != null ? r.getAdmin().getNombre() : null,
                r.getNotas(),
                r.getNotasAdmin(),
                r.getCreatedAt(),
                r.getConfirmadoAt(),
                List.of()
        );
    }

    private RecepcionRemitoResponse toResponseConItems(RecepcionRemito r) {
        List<MovimientoStock> movimientos = movimientoStockRepository
                .findByRecepcionRemitoIdOrderByFechaAsc(r.getId());

        List<RecepcionRemitoResponse.ItemRecepcionResponse> items = movimientos.stream()
                .map(m -> new RecepcionRemitoResponse.ItemRecepcionResponse(
                        m.getId(),
                        m.getProducto().getId(),
                        m.getProducto().getSku(),
                        m.getProducto().getNombre(),
                        m.getCantidad(),
                        m.getStockAnterior(),
                        m.getStockNuevo(),
                        m.getFecha()
                )).toList();

        return new RecepcionRemitoResponse(
                r.getId(),
                r.getProveedor().getId(),
                r.getProveedor().getNombre(),
                r.getNumeroRemito(),
                r.getEstado(),
                r.getEmpleado().getNombre(),
                r.getAdmin() != null ? r.getAdmin().getNombre() : null,
                r.getNotas(),
                r.getNotasAdmin(),
                r.getCreatedAt(),
                r.getConfirmadoAt(),
                items
        );
    }
}
