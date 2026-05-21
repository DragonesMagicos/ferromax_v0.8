package com.ferromax.erp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "recepciones_remito",
    indexes = {
        @Index(name = "idx_recepcion_remito_proveedor", columnList = "proveedor_id"),
        @Index(name = "idx_recepcion_remito_estado",    columnList = "estado"),
        @Index(name = "idx_recepcion_remito_empleado",  columnList = "empleado_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class RecepcionRemito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGSERIAL")
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_recepcion_proveedor"))
    private Proveedor proveedor;

    @NotBlank
    @Size(max = 100)
    @Column(name = "numero_remito", nullable = false, length = 100)
    private String numeroRemito;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoRecepcionEnum estado = EstadoRecepcionEnum.PENDIENTE;

    // Empleado que registró la recepción
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_recepcion_empleado"))
    private Usuario empleado;

    // Admin que confirmó o rechazó (null mientras está PENDIENTE)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id",
                foreignKey = @ForeignKey(name = "fk_recepcion_admin"))
    private Usuario admin;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "notas_admin", columnDefinition = "TEXT")
    private String notasAdmin;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt;

    @Column(name = "confirmado_at", columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime confirmadoAt;

    // Movimientos de stock asociados a este remito
    @OneToMany(mappedBy = "recepcionRemito", fetch = FetchType.LAZY)
    private List<MovimientoStock> movimientos = new ArrayList<>();
}