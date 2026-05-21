package com.ferromax.erp.repository;

import com.ferromax.erp.model.ItemOrdenCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemOrdenCompraRepository extends JpaRepository<ItemOrdenCompra, Long> {
}
