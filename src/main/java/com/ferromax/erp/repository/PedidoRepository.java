package com.ferromax.erp.repository;

import com.ferromax.erp.model.EstadoPedidoEnum;
import com.ferromax.erp.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByClienteId(Long clienteId);

    List<Pedido> findByEstado(EstadoPedidoEnum estado);

    int countByEstadoIn(List<EstadoPedidoEnum> estados);
}
