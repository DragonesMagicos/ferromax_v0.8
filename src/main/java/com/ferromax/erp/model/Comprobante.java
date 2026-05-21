package com.ferromax.erp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "comprobantes")
@Getter
@Setter
@NoArgsConstructor
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGSERIAL")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TipoComprobanteEnum tipo;

    @Size(max = 20)
    @Column(length = 20)
    private String numero;

    @Column(columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime fecha;

    // Código de Autorización Electrónico de AFIP — null hasta integrar facturación electrónica
    @Size(max = 20)
    @Column(length = 20)
    private String cae;

    @Size(max = 500)
    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_id", nullable = false, unique = true,
                foreignKey = @ForeignKey(name = "fk_comprobantes_venta"))
    private Venta venta;
}
