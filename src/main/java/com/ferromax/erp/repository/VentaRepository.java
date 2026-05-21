package com.ferromax.erp.repository;

import com.ferromax.erp.model.EstadoVentaEnum;
import com.ferromax.erp.model.MedioPagoEnum;
import com.ferromax.erp.model.OrigenVentaEnum;
import com.ferromax.erp.model.Venta;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {

    List<Venta> findByCajeroId(Long cajeroId);

    List<Venta> findByCajeroIdAndOrigenOrderByFechaDesc(Long cajeroId, OrigenVentaEnum origen);

    List<Venta> findByCajeroIdAndFechaBetween(Long cajeroId, OffsetDateTime desde, OffsetDateTime hasta);

    List<Venta> findByFechaBetween(OffsetDateTime desde, OffsetDateTime hasta);

    List<Venta> findAllByOrderByFechaDesc(Pageable pageable);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v " +
           "WHERE v.fecha >= :inicio AND v.fecha < :fin AND v.estado = :estado")
    BigDecimal sumTotalByFechaAndEstado(@Param("inicio") OffsetDateTime inicio,
                                        @Param("fin") OffsetDateTime fin,
                                        @Param("estado") EstadoVentaEnum estado);

    @Query("SELECT COUNT(v) FROM Venta v WHERE v.fecha >= :inicio AND v.fecha < :fin AND v.estado = :estado")
    int countByFechaAndEstado(@Param("inicio") OffsetDateTime inicio,
                               @Param("fin") OffsetDateTime fin,
                               @Param("estado") EstadoVentaEnum estado);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v " +
           "WHERE v.fecha >= :inicio AND v.fecha < :fin " +
           "AND v.estado = :estado AND v.medioPago = :medioPago")
    BigDecimal sumTotalByFechaAndEstadoAndMedioPago(@Param("inicio") OffsetDateTime inicio,
                                                     @Param("fin") OffsetDateTime fin,
                                                     @Param("estado") EstadoVentaEnum estado,
                                                     @Param("medioPago") MedioPagoEnum medioPago);
}
