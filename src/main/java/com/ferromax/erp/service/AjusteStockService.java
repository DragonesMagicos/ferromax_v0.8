package com.ferromax.erp.service;

import com.ferromax.erp.dto.AjusteStockRequest;
import com.ferromax.erp.dto.AjusteStockResponse;
import com.ferromax.erp.exception.RecursoNoEncontradoException;
import com.ferromax.erp.model.MovimientoStock;
import com.ferromax.erp.model.Producto;
import com.ferromax.erp.model.TipoMovimientoEnum;
import com.ferromax.erp.model.Usuario;
import com.ferromax.erp.repository.MovimientoStockRepository;
import com.ferromax.erp.repository.ProductoRepository;
import com.ferromax.erp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AjusteStockService {

    private final ProductoRepository productoRepository;
    private final MovimientoStockRepository movimientoStockRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public AjusteStockResponse ajustar(AjusteStockRequest request, Long adminId) {
        Producto producto = productoRepository.findById(request.productoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", request.productoId()));

        int stockAnterior = producto.getStockActual();
        int stockNuevo = stockAnterior + request.cantidad();

        if (stockNuevo < 0)
            throw new IllegalArgumentException("El ajuste dejaría el stock en negativo (" + stockNuevo + ")");

        producto.setStockActual(stockNuevo);
        productoRepository.save(producto);

        Usuario admin = usuarioRepository.findById(adminId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", adminId));

        MovimientoStock mov = new MovimientoStock();
        mov.setProducto(producto);
        mov.setTipo(TipoMovimientoEnum.AJUSTE);
        mov.setCantidad(request.cantidad());
        mov.setStockAnterior(stockAnterior);
        mov.setStockNuevo(stockNuevo);
        mov.setNotas(request.motivo());
        mov.setUsuario(admin);
        movimientoStockRepository.save(mov);

        return toResponse(mov, producto, admin);
    }

    @Transactional(readOnly = true)
    public Page<AjusteStockResponse> listarAjustes(int page, int size) {
        return movimientoStockRepository
                .findAjustesOrderByFechaDesc(PageRequest.of(page, size))
                .map(m -> toResponse(m, m.getProducto(), m.getUsuario()));
    }

    private AjusteStockResponse toResponse(MovimientoStock m, Producto p, Usuario u) {
        return new AjusteStockResponse(
                m.getId(),
                p.getId(),
                p.getSku(),
                p.getNombre(),
                m.getCantidad(),
                m.getStockAnterior(),
                m.getStockNuevo(),
                m.getNotas(),
                u != null ? u.getNombre() : null,
                m.getFecha()
        );
    }
}
