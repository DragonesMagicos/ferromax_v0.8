package com.ferromax.erp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(
    name = "movimientos_stock",
    indexes = {
        @Index(name = "idx_mov_stock_producto_id", columnList = "producto_id"),
        @Index(name = "idx_mov_stock_fecha",       columnList = "fecha")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class MovimientoStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGSERIAL")
    private Long id;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimientoEnum tipo;

    // Positivo = entrada de stock, negativo = salida
    @NotNull
    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "stock_anterior")
    private Integer stockAnterior;

    @Column(name = "stock_nuevo")
    private Integer stockNuevo;

    @CreationTimestamp
    @Column(nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime fecha;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_mov_stock_producto"))
    private Producto producto;

    // Null cuando el movimiento lo genera el sistema automáticamente
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id",
                foreignKey = @ForeignKey(name = "fk_mov_stock_usuario"))
    private Usuario usuario;

    // Null para movimientos que no corresponden a una recepción de remito
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recepcion_remito_id",
                foreignKey = @ForeignKey(name = "fk_mov_stock_recepcion_remito"))
    private RecepcionRemito recepcionRemito;
}
