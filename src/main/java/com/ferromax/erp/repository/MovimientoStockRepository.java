package com.ferromax.erp.repository;

import com.ferromax.erp.model.MovimientoStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, Long> {

    List<MovimientoStock> findByRecepcionRemitoIdOrderByFechaAsc(Long recepcionRemitoId);

    @Query("""
        SELECT m FROM MovimientoStock m
        JOIN FETCH m.producto p
        LEFT JOIN FETCH m.usuario u
        WHERE m.tipo = com.ferromax.erp.model.TipoMovimientoEnum.AJUSTE
        ORDER BY m.fecha DESC
        """)
    Page<MovimientoStock> findAjustesOrderByFechaDesc(Pageable pageable);
}
