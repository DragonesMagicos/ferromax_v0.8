package com.ferromax.erp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
    name = "clientes",
    uniqueConstraints = @UniqueConstraint(name = "uk_clientes_email", columnNames = "email")
)
@Getter
@Setter
@NoArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGSERIAL")
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String nombre;

    @Size(max = 100)
    @Column(length = 100)
    private String apellido;

    @Email
    @Size(max = 150)
    @Column(unique = true, length = 150)
    private String email;

    @Size(max = 15)
    @Column(length = 15)
    private String cuit;

    @Size(max = 50)
    @Column(length = 50)
    private String telefono;

    @Size(max = 50)
    @Column(name = "condicion_iva", length = 50)
    private String condicionIva;

    @Column(name = "saldo_cuenta", nullable = false, precision = 12, scale = 2,
            columnDefinition = "NUMERIC(12,2)")
    private BigDecimal saldoCuenta = BigDecimal.ZERO;

    @JsonIgnore
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Direccion> direcciones = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false,
            columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime updatedAt;
}
