package com.ferromax.erp.repository;

import com.ferromax.erp.model.EstadoRecepcionEnum;
import com.ferromax.erp.model.RecepcionRemito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecepcionRemitoRepository extends JpaRepository<RecepcionRemito, Long> {

    List<RecepcionRemito> findByEstadoOrderByCreatedAtDesc(EstadoRecepcionEnum estado);

    List<RecepcionRemito> findByEmpleadoIdOrderByCreatedAtDesc(Long empleadoId);

    @Query("""
        SELECT r FROM RecepcionRemito r
        LEFT JOIN FETCH r.proveedor
        LEFT JOIN FETCH r.empleado
        LEFT JOIN FETCH r.admin
        WHERE r.id = :id
    """)
    java.util.Optional<RecepcionRemito> findByIdConDetalle(Long id);
}