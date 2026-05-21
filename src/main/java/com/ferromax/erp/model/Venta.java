package com.ferromax.erp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "ventas",
    indexes = {
        @Index(name = "idx_ventas_cajero_id", columnList = "cajero_id"),
        @Index(name = "idx_ventas_fecha",     columnList = "fecha")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGSERIAL")
    private Long id;

    @CreationTimestamp
    @Column(nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime fecha;

    @Column(precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2)")
    private BigDecimal total;

    @Column(precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2)")
    private BigDecimal descuento = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2, columnDefinition = "NUMERIC(12,2)")
    private BigDecimal subtotal;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoVentaEnum estado = EstadoVentaEnum.COMPLETADA;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "medio_pago", nullable = false, length = 20)
    private MedioPagoEnum medioPago;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private OrigenVentaEnum origen = OrigenVentaEnum.POS;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cajero_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_ventas_cajero"))
    private Usuario cajero;

    // Null cuando la venta es anónima (mostrador sin identificar al cliente)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id",
                foreignKey = @ForeignKey(name = "fk_ventas_cliente"))
    private Cliente cliente;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ItemVenta> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false,
            columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime updatedAt;
}
