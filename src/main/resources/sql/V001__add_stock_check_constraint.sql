-- =============================================================
--  V001 — Constraint: stock_actual no puede ser negativo
--  Ejecutar UNA SOLA VEZ contra ferromax_db (psql o DBeaver)
--  Requiere rol con ALTER TABLE (postgres o el owner de la tabla)
-- =============================================================

-- 1. Verificar si ya existe el constraint
SELECT conname
FROM pg_constraint
WHERE conrelid = 'productos'::regclass
  AND conname = 'chk_stock_no_negativo';

-- 2. Corregir filas con stock negativo (si las hay) antes de aplicar el constraint
--    Descomentá si el SELECT anterior devuelve filas antes del ALTER TABLE:
-- UPDATE productos SET stock_actual = 0 WHERE stock_actual < 0;

-- 3. Agregar el constraint
ALTER TABLE productos
    ADD CONSTRAINT chk_stock_no_negativo CHECK (stock_actual >= 0);

-- 4. Verificación final
SELECT conname, pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid = 'productos'::regclass
  AND conname = 'chk_stock_no_negativo';
