package com.ferromax.erp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "items_orden_compra")
@Getter
@Setter
@NoArgsConstructor
public class ItemOrdenCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGSERIAL")
    private Long id;

    @Column(name = "cantidad_pedida")
    private Integer cantidadPedida;

    @Column(name = "cantidad_recibida")
    private Integer cantidadRecibida = 0;

    @Column(name = "precio_compra", precision = 12, scale = 2,
            columnDefinition = "NUMERIC(12,2)")
    private BigDecimal precioCompra;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_compra_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_items_oc_orden_compra"))
    private OrdenCompra ordenCompra;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_items_oc_producto"))
    private Producto producto;
}
