package com.ferromax.erp.repository;

import com.ferromax.erp.model.AlertaStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface AlertaStockRepository extends JpaRepository<AlertaStock, Long> {

    List<AlertaStock> findByLidaFalseOrderByFechaGeneracionDesc();

    List<AlertaStock> findByLidaFalse();

    List<AlertaStock> findByProductoId(Long productoId);

    List<AlertaStock> findByFechaGeneracionAfterOrderByFechaGeneracionDesc(OffsetDateTime desde);
}
