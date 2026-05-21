"""
Verifica cuántos productos tienen/no tienen imagen descargada en disco.
"""
import psycopg2
from pathlib import Path

IMG_DIR = Path(__file__).resolve().parent.parent / "ferromax-web" / "public" / "img" / "productos"
DB_CONFIG = dict(host="localhost", port=5432, dbname="ferromax_db", user="postgres", password="doky2010")

con = psycopg2.connect(**DB_CONFIG)
cur = con.cursor()

cur.execute("SELECT sku, nombre, imagen_url FROM productos WHERE activo = TRUE ORDER BY sku")
productos = cur.fetchall()
cur.close(); con.close()

sin_imagen_disco = []
sin_imagen_bd = []
con_imagen = 0

for sku, nombre, imagen_url in productos:
    archivo = IMG_DIR / f"{sku}.jpg"
    en_disco = archivo.exists()
    if en_disco:
        con_imagen += 1
    else:
        sin_imagen_disco.append((sku, nombre))
    if not imagen_url:
        sin_imagen_bd.append(sku)

print(f"Total productos activos : {len(productos)}")
print(f"Con imagen en disco     : {con_imagen}")
print(f"Sin imagen en disco     : {len(sin_imagen_disco)}")
print(f"Sin imagen_url en BD    : {len(sin_imagen_bd)}")
print()
if sin_imagen_disco:
    print("SKUs sin imagen en disco:")
    for sku, nombre in sin_imagen_disco:
        print(f"  {sku:<20} {nombre}")
