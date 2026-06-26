package com.ferromax.erp.repository;

import com.ferromax.erp.model.Categoria;
import com.ferromax.erp.model.Producto;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.QueryHint;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    // SELECT ... FOR UPDATE — bloquea la fila hasta que termine la transacción.
    // Cualquier otro thread que intente leer el mismo producto espera hasta 3s.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("SELECT p FROM Producto p WHERE p.id = :id")
    Optional<Producto> findByIdForUpdate(@Param("id") Long id);

    Optional<Producto> findBySku(String sku);

    Optional<Producto> findByCodigoBarras(String codigoBarras);

    List<Producto> findAllByActivoTrue();

    @Query("SELECT p FROM Producto p WHERE p.stockActual <= p.stockMinimo AND p.activo = true")
    List<Producto> findProductosConStockCritico();

    long countByCategoriaAndActivoTrue(Categoria categoria);

    List<Producto> findByCategoriaAndActivoTrueOrderByNombreAsc(Categoria categoria);

    List<Producto> findTop4ByCategoriaAndActivoTrueAndImagenUrlNotNullOrderByNombreAsc(Categoria categoria);

    Page<Producto> findByCategoriaAndActivoTrueOrderByNombreAsc(Categoria categoria, Pageable pageable);

    Page<Producto> findByActivoTrueOrderByNombreAsc(Pageable pageable);

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND (LOWER(p.nombre) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY p.nombre ASC")
    List<Producto> buscarPorNombreOSku(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM Producto p WHERE p.categoria = :cat AND p.activo = true AND p.descripcion LIKE :subLike ORDER BY p.nombre ASC")
    Page<Producto> findByCategoriaAndSubcategoria(
            @Param("cat") Categoria cat,
            @Param("subLike") String subLike,
            Pageable pageable);
}
