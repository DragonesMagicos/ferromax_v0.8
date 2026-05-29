package com.ferromax.erp.service;

import com.ferromax.erp.dto.ItemVentaRequest;
import com.ferromax.erp.dto.ItemVentaResponse;
import com.ferromax.erp.dto.StockUpdateEvent;
import com.ferromax.erp.dto.VentaDetalleResponse;
import com.ferromax.erp.dto.VentaRequest;
import com.ferromax.erp.dto.VentaResponse;
import com.ferromax.erp.exception.RecursoNoEncontradoException;
import com.ferromax.erp.model.Comprobante;
import com.ferromax.erp.model.EstadoVentaEnum;
import com.ferromax.erp.model.ItemVenta;
import com.ferromax.erp.model.MedioPagoEnum;
import com.ferromax.erp.model.MovimientoStock;
import com.ferromax.erp.model.OrigenVentaEnum;
import com.ferromax.erp.model.Producto;
import com.ferromax.erp.model.TipoComprobanteEnum;
import com.ferromax.erp.model.TipoMovimientoEnum;
import com.ferromax.erp.model.Venta;
import com.ferromax.erp.repository.ClienteRepository;
import com.ferromax.erp.repository.ComprobanteRepository;
import com.ferromax.erp.repository.MovimientoStockRepository;
import com.ferromax.erp.repository.ProductoRepository;
import com.ferromax.erp.repository.UsuarioRepository;
import com.ferromax.erp.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
public class VentaService {

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final ComprobanteRepository comprobanteRepository;
    private final MovimientoStockRepository movimientoStockRepository;
    private final ProductoService productoService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public VentaDetalleResponse registrarVenta(VentaRequest request, Long cajeroId, OrigenVentaEnum origen) {

        // PASO 1 — Verificar stock de todos los productos antes de tocar nada
        List<Producto> productos = new ArrayList<>();
        for (ItemVentaRequest item : request.items()) {
            Producto producto = productoRepository.findById(item.productoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto", item.productoId()));

            if (producto.getStockActual() < item.cantidad()) {
                throw new IllegalArgumentException("Stock insuficiente para: " + producto.getNombre());
            }

            productos.add(producto);
        }

        // PASO 2 — Crear la venta
        Venta venta = new Venta();
        venta.setEstado(EstadoVentaEnum.COMPLETADA);
        venta.setOrigen(origen);
        venta.setMedioPago(MedioPagoEnum.valueOf(request.medioPago()));
        venta.setCajero(usuarioRepository.findById(cajeroId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", cajeroId)));

        if (request.clienteId() != null) {
            venta.setCliente(clienteRepository.findById(request.clienteId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Cliente", request.clienteId())));
        }

        // PASO 3 — Crear los items y calcular el total
        BigDecimal total = BigDecimal.ZERO;
        List<ItemVentaRequest> items = request.items();

        for (int i = 0; i < items.size(); i++) {
            ItemVentaRequest itemRequest = items.get(i);
            Producto producto = productos.get(i);

            BigDecimal subtotal = producto.getPrecio()
                    .multiply(BigDecimal.valueOf(itemRequest.cantidad()));

            ItemVenta itemVenta = new ItemVenta();
            itemVenta.setProducto(producto);
            itemVenta.setCantidad(itemRequest.cantidad());
            itemVenta.setPrecioUnitario(producto.getPrecio());
            itemVenta.setSubtotal(subtotal);
            itemVenta.setVenta(venta);

            venta.getItems().add(itemVenta);
            total = total.add(subtotal);
        }

        venta.setSubtotal(total);
        venta.setDescuento(BigDecimal.ZERO);
        venta.setTotal(total);

        // PASO 4 — Descontar el stock con tipo VENTA y generar alertas si corresponde
        for (int i = 0; i < items.size(); i++) {
            Producto producto = productos.get(i);
            int stockAnterior = producto.getStockActual();
            int nuevoStock = stockAnterior - items.get(i).cantidad();

            producto.setStockActual(nuevoStock);
            productoRepository.save(producto);

            MovimientoStock mov = new MovimientoStock();
            mov.setProducto(producto);
            mov.setTipo(TipoMovimientoEnum.VENTA);
            mov.setCantidad(-items.get(i).cantidad());
            mov.setStockAnterior(stockAnterior);
            mov.setStockNuevo(nuevoStock);
            movimientoStockRepository.save(mov);

            productoService.generarAlertaSiCorrespondePublico(producto, nuevoStock);

            messagingTemplate.convertAndSend(
                    "/topic/stock/" + producto.getId(),
                    new StockUpdateEvent(producto.getId(), producto.getSku(), nuevoStock));
        }

        // PASO 5 — Guardar la venta y crear el comprobante
        Venta ventaGuardada = ventaRepository.save(venta);

        Comprobante comprobante = new Comprobante();
        comprobante.setTipo(TipoComprobanteEnum.TICKET);
        comprobante.setVenta(ventaGuardada);
        comprobanteRepository.save(comprobante);

        return toDetalleResponse(ventaGuardada);
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listarPorRango(OffsetDateTime desde, OffsetDateTime hasta) {
        return ventaRepository.findByFechaBetween(desde, hasta)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VentaResponse buscarPorId(Long id) {
        return toResponse(ventaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Venta", id)));
    }

    @Transactional(readOnly = true)
    public VentaDetalleResponse buscarDetallePorId(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Venta", id));
        return toDetalleResponse(venta);
    }

    @Transactional
    public VentaResponse anular(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Venta", id));

        if (venta.getEstado() == EstadoVentaEnum.ANULADA) {
            throw new IllegalArgumentException("La venta " + id + " ya está anulada");
        }

        // Devolver stock de cada ítem y registrar movimiento de devolución
        for (ItemVenta item : venta.getItems()) {
            Producto producto = item.getProducto();
            int stockAnterior = producto.getStockActual();
            int stockNuevo = stockAnterior + item.getCantidad();

            producto.setStockActual(stockNuevo);
            productoRepository.save(producto);

            MovimientoStock mov = new MovimientoStock();
            mov.setProducto(producto);
            mov.setTipo(TipoMovimientoEnum.DEVOLUCION);
            mov.setCantidad(item.getCantidad());
            mov.setStockAnterior(stockAnterior);
            mov.setStockNuevo(stockNuevo);
            mov.setNotas("Devolución por anulación de venta #" + id);
            movimientoStockRepository.save(mov);
        }

        venta.setEstado(EstadoVentaEnum.ANULADA);
        return toResponse(ventaRepository.save(venta));
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listarMisComprasWeb(Long usuarioId) {
        return ventaRepository.findByCajeroIdAndOrigenOrderByFechaDesc(usuarioId, OrigenVentaEnum.WEB)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listarDelDiaPorCajero(Long cajeroId) {
        ZoneId zonaAr = ZoneId.of("America/Argentina/Buenos_Aires");
        OffsetDateTime inicio = LocalDate.now(zonaAr).atStartOfDay(zonaAr).toOffsetDateTime();
        OffsetDateTime fin = inicio.plusDays(1);
        return ventaRepository.findByCajeroIdAndFechaBetween(cajeroId, inicio, fin)
                .stream()
                .map(this::toResponse)
                .toList();
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

    private VentaDetalleResponse toDetalleResponse(Venta venta) {
        String nombreCajero = (venta.getCajero().getNombre()
                + " " + venta.getCajero().getApellido()).strip();
        String origen = venta.getOrigen() != null ? venta.getOrigen().name() : "POS";

        List<ItemVentaResponse> itemsDto = venta.getItems().stream()
                .map(item -> new ItemVentaResponse(
                        item.getProducto().getId(),
                        item.getProducto().getSku(),
                        item.getProducto().getNombre(),
                        item.getCantidad(),
                        item.getPrecioUnitario(),
                        item.getSubtotal()))
                .toList();

        Long comprobanteId = comprobanteRepository.findByVentaId(venta.getId())
                .map(c -> c.getId())
                .orElse(null);

        return new VentaDetalleResponse(
                venta.getId(),
                venta.getFecha(),
                venta.getSubtotal(),
                venta.getDescuento(),
                venta.getTotal(),
                venta.getEstado().name(),
                venta.getMedioPago().name(),
                nombreCajero,
                origen,
                comprobanteId,
                itemsDto
        );
    }
}
