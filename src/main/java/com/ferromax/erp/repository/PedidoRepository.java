package com.ferromax.erp.repository;

import com.ferromax.erp.model.EstadoPedidoEnum;
import com.ferromax.erp.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByClienteId(Long clienteId);

    List<Pedido> findByEstado(EstadoPedidoEnum estado);

    int countByEstadoIn(List<EstadoPedidoEnum> estados);

    @Query("SELECT p.cliente.id AS clienteId, SUM(p.total) AS totalCompras FROM Pedido p GROUP BY p.cliente.id")
    List<Map<String, Object>> sumTotalPorCliente();
}
