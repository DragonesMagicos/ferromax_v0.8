package com.ferromax.erp.repository;

import com.ferromax.erp.model.ItemVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemVentaRepository extends JpaRepository<ItemVenta, Long> {
}
