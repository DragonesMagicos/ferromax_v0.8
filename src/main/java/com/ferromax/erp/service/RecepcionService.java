package com.ferromax.erp.service;

import com.ferromax.erp.dto.RecepcionRequest;
import com.ferromax.erp.dto.RecepcionResponse;
import com.ferromax.erp.exception.RecursoNoEncontradoException;
import com.ferromax.erp.model.MovimientoStock;
import com.ferromax.erp.model.Producto;
import com.ferromax.erp.model.RecepcionRemito;
import com.ferromax.erp.model.TipoMovimientoEnum;
import com.ferromax.erp.repository.MovimientoStockRepository;
import com.ferromax.erp.repository.ProductoRepository;
import com.ferromax.erp.repository.RecepcionRemitoRepository;
import com.ferromax.erp.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecepcionService {

    private final ProductoRepository productoRepository;
    private final MovimientoStockRepository movimientoStockRepository;
    private final UsuarioRepository usuarioRepository;
    private final RecepcionRemitoRepository recepcionRemitoRepository;
    private final EntityManager entityManager;

    @Transactional
    public RecepcionResponse recibirMercaderia(RecepcionRequest request, Long empleadoId) {
        Producto producto = productoRepository.findById(request.productoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", request.productoId()));

        int stockAnterior = producto.getStockActual();
        int stockNuevo = stockAnterior + request.cantidad();

        producto.setStockActual(stockNuevo);
        productoRepository.save(producto);

        MovimientoStock mov = new MovimientoStock();
        mov.setProducto(producto);
        mov.setTipo(TipoMovimientoEnum.ENTRADA);
        mov.setCantidad(request.cantidad());
        mov.setStockAnterior(stockAnterior);
        mov.setStockNuevo(stockNuevo);
        mov.setNotas(request.notas());
        mov.setUsuario(usuarioRepository.findById(empleadoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", empleadoId)));

        // Vincular al remito si se proveyó el ID
        if (request.recepcionRemitoId() != null) {
            RecepcionRemito remito = recepcionRemitoRepository.findById(request.recepcionRemitoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("RecepcionRemito", request.recepcionRemitoId()));
            mov.setRecepcionRemito(remito);
        }

        movimientoStockRepository.save(mov);
        entityManager.flush();

        return new RecepcionResponse(
                mov.getId(),
                producto.getId(),
                producto.getSku(),
                producto.getNombre(),
                request.cantidad(),
                stockAnterior,
                stockNuevo,
                mov.getFecha()
        );
    }
}
