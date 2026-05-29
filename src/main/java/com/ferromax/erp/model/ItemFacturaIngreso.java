package com.ferromax.erp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "items_factura_ingreso")
@Getter @Setter @NoArgsConstructor
public class ItemFacturaIngreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGSERIAL")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "factura_ingreso_id", nullable = false)
    private FacturaIngreso facturaIngreso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Column(name = "descripcion_original", length = 500)
    private String descripcionOriginal;

    @Column(name = "codigo_sku_original", length = 100)
    private String codigoSkuOriginal;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", precision = 12, scale = 2,
            columnDefinition = "NUMERIC(12,2)")
    private BigDecimal precioUnitario;

    @Column(name = "ingresado_al_stock")
    private boolean ingresadoAlStock = false;
}
