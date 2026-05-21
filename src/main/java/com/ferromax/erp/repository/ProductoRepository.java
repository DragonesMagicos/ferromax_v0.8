package com.ferromax.erp.repository;

import com.ferromax.erp.model.Categoria;
import com.ferromax.erp.model.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

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

    @Query("SELECT p FROM Producto p WHERE p.categoria = :cat AND p.activo = true AND p.descripcion LIKE :subLike ORDER BY p.nombre ASC")
    Page<Producto> findByCategoriaAndSubcategoria(
            @Param("cat") Categoria cat,
            @Param("subLike") String subLike,
            Pageable pageable);
}
