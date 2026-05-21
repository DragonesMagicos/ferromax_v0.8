package com.ferromax.erp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(
    name = "alertas_stock",
    indexes = @Index(name = "idx_alertas_stock_lida", columnList = "lida")
)
@Getter
@Setter
@NoArgsConstructor
public class AlertaStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGSERIAL")
    private Long id;

    // Valores esperados: STOCK_CRITICO, SIN_STOCK
    @Size(max = 20)
    @Column(name = "alerta_enum", length = 20)
    private String alertaEnum;

    @CreationTimestamp
    @Column(name = "fecha_generacion", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime fechaGeneracion;

    // false = pendiente de revisión, true = ya vista por el operador
    @Column(nullable = false)
    private Boolean lida = Boolean.FALSE;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_alertas_stock_producto"))
    private Producto producto;

    // Null cuando la alerta la generó el sistema (ej: job automático de revisión de stock)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generada_por_id",
                foreignKey = @ForeignKey(name = "fk_alertas_stock_generada_por"))
    private Usuario generadaPor;
}
