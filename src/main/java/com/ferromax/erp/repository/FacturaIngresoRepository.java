package com.ferromax.erp.repository;

import com.ferromax.erp.model.FacturaIngreso;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface FacturaIngresoRepository extends JpaRepository<FacturaIngreso, Long> {

    Optional<FacturaIngreso> findByNumeroFactura(String numeroFactura);

    boolean existsByNumeroFactura(String numeroFactura);

    @Query("SELECT f FROM FacturaIngreso f ORDER BY f.createdAt DESC")
    Page<FacturaIngreso> findAllOrdenadas(Pageable pageable);
}
