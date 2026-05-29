package com.ferromax.erp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "facturas_ingreso",
    indexes = @Index(name = "idx_facturas_nro", columnList = "numero_factura")
)
@Getter @Setter @NoArgsConstructor
public class FacturaIngreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGSERIAL")
    private Long id;

    @Column(name = "numero_factura", length = 50)
    private String numeroFactura;

    @Column(name = "proveedor_nombre", length = 200)
    private String proveedorNombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @Column(name = "archivo_nombre", length = 255)
    private String archivoNombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoFacturaEnum estado = EstadoFacturaEnum.BORRADOR;

    @Column(length = 500)
    private String notas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt;

    @Column(name = "confirmado_at", columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime confirmadoAt;

    @OneToMany(mappedBy = "facturaIngreso", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemFacturaIngreso> items = new ArrayList<>();
}
