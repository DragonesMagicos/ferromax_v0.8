"""
reimport_imagenes.py — Re-descarga imágenes desde www.extrapowersa.com.ar (primary)
con fallback a Bing Image Search.

Por cada producto:
  1. Busca el SKU en extrapowersa.com.ar/catalogsearch/result/?q={SKU}
  2. Toma la primera imagen (data-src) y la convierte a resolución 800×800.
  3. Si no encuentra, busca en Bing.
  4. Aplica letterbox sobre fondo blanco a 800×800 JPEG.
  5. Sobrescribe la imagen existente y actualiza imagen_url en la BD.

Uso:
    python scripts/reimport_imagenes.py [--max-por-cat N] [--solo-faltantes]

Flags:
    --max-por-cat N    máximo de productos por categoría (default: 20, 0=todos)
    --solo-faltantes   solo descarga las que no tienen imagen en disco
"""

import sys, io, re, time, shutil, tempfile, logging, argparse
import requests, psycopg2
from pathlib import Path
from PIL import Image
from io import BytesIO
from bs4 import BeautifulSoup
from icrawler.builtin import BingImageCrawler

# ─── Config ───────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent
IMG_DIR    = BASE_DIR / "ferromax-web" / "public" / "img" / "productos"
IMG_SIZE   = (800, 800)
IMG_BG     = (255, 255, 255)
IMG_DIR.mkdir(parents=True, exist_ok=True)

DB_CONFIG = dict(host="localhost", port=5432, dbname="ferromax_db",
                 user="postgres", password="doky2010")

EPSA_SEARCH  = "https://www.extrapowersa.com.ar/catalogsearch/result/?q={}"
HEADERS      = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
DELAY_EPSA   = 1.2   # segundos entre requests a EPSA
DELAY_BING   = 2.0   # segundos entre requests a Bing
MAX_INTENTOS = 3

# ─── Logging ──────────────────────────────────────────────────────────────────
_handler = logging.StreamHandler(
    open(sys.stdout.fileno(), mode="w", encoding="utf-8", errors="replace", closefd=False)
)
_handler.setFormatter(logging.Formatter("%(asctime)s  %(levelname)-7s  %(message)s", "%H:%M:%S"))
logging.basicConfig(level=logging.INFO,
                    handlers=[_handler,
                               logging.FileHandler(BASE_DIR / "scripts" / "reimport_imagenes.log",
                                                   encoding="utf-8")])
log = logging.getLogger(__name__)

# ─── Helpers imagen ───────────────────────────────────────────────────────────

def letterbox(img: Image.Image, ruta: Path):
    rgba = img.convert("RGBA")
    tw, th = IMG_SIZE
    sw, sh = rgba.size
    esc = min(tw / sw, th / sh)
    nw, nh = max(1, int(sw * esc)), max(1, int(sh * esc))
    scaled = rgba.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGB", IMG_SIZE, IMG_BG)
    canvas.paste(scaled, ((tw - nw) // 2, (th - nh) // 2), mask=scaled.split()[3])
    canvas.save(ruta, "JPEG", quality=87, optimize=True)


def descargar_bytes(url: str) -> bytes:
    r = requests.get(url, headers=HEADERS, timeout=12)
    r.raise_for_status()
    return r.content


# ─── Fuente 1: extrapowersa.com.ar ────────────────────────────────────────────

def buscar_en_epsa(sku: str) -> list[str]:
    """Devuelve lista de URLs de imágenes (resolución 800×800) para el SKU."""
    try:
        r = requests.get(EPSA_SEARCH.format(requests.utils.quote(sku)),
                         headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return []
        soup = BeautifulSoup(r.text, "lxml")
        data_srcs = [
            tag.get("data-src", "")
            for tag in soup.find_all(attrs={"data-src": re.compile(r"catalog/product")})
            if tag.get("data-src")
        ]
        # Convertir small_image → image/800x800 para máxima calidad
        urls = []
        for ds in data_srcs:
            large = re.sub(r"/cache/1/[^/]+/[0-9x]+/[a-f0-9]+/",
                           "/cache/1/image/800x800/9df78eab33525d08d6e5fb8d27136e95/",
                           ds)
            urls.append(large)
        return urls
    except Exception as e:
        log.debug("EPSA error SKU=%s: %s", sku, e)
        return []


def intentar_epsa(sku: str, ruta: Path) -> bool:
    urls = buscar_en_epsa(sku)
    if not urls:
        return False
    for url in urls[:3]:
        try:
            data = descargar_bytes(url)
            img  = Image.open(BytesIO(data))
            letterbox(img, ruta)
            log.info("  SKU=%-12s [EPSA] OK  %s", sku, ruta.name)
            return True
        except Exception:
            continue
    return False


# ─── Fuente 2: Bing (fallback) ────────────────────────────────────────────────

def construir_query(marca: str, nombre: str) -> str:
    if marca.upper() in ("NACIONAL", "S/MARCA", "SIN MARCA", ""):
        return f"{nombre} herramienta ferretería"
    return f"{marca} {nombre} herramienta"


def intentar_bing(sku: str, marca: str, nombre: str, ruta: Path) -> bool:
    sku_safe = re.sub(r'[\\/:*?"<>|]', "_", sku)
    query    = construir_query(marca, nombre)
    tmp      = Path(tempfile.mkdtemp(prefix=f"ferromax_{sku_safe}_"))
    try:
        for intento in range(1, MAX_INTENTOS + 1):
            try:
                crawler = BingImageCrawler(storage={"root_dir": str(tmp)},
                                           log_level=logging.ERROR)
                crawler.crawl(keyword=query, max_num=3, file_idx_offset=0)
                archivos = sorted(tmp.glob("*.*"))
                for arch in archivos:
                    try:
                        img = Image.open(arch)
                        letterbox(img, ruta)
                        log.info("  SKU=%-12s [BING]  OK  %s", sku, ruta.name)
                        return True
                    except Exception:
                        continue
            except Exception as e:
                log.warning("  SKU=%-12s [BING]  intento %d/%d: %s", sku, intento, MAX_INTENTOS, e)
            if intento < MAX_INTENTOS:
                time.sleep(DELAY_BING * intento)
                for f in tmp.iterdir(): f.unlink(missing_ok=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return False


# ─── Procesamiento principal ──────────────────────────────────────────────────

def procesar_producto(sku: str, nombre: str, marca: str,
                      solo_faltantes: bool) -> tuple[bool, str]:
    """Devuelve (ok, fuente). fuente ∈ {'epsa','bing','skip','fallo'}"""
    ruta = IMG_DIR / f"{sku}.jpg"

    if solo_faltantes and ruta.exists():
        return True, "skip"

    # Intentar EPSA
    time.sleep(DELAY_EPSA)
    if intentar_epsa(sku, ruta):
        return True, "epsa"

    # Fallback Bing
    if intentar_bing(sku, marca, nombre, ruta):
        return True, "bing"

    log.warning("  SKU=%-12s FALLIDA (sin imagen en ninguna fuente)", sku)
    return False, "fallo"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-por-cat", type=int, default=20,
                        help="Máx productos por categoría (0=todos)")
    parser.add_argument("--solo-faltantes", action="store_true",
                        help="Solo descargar las que faltan en disco")
    args = parser.parse_args()
    max_cat = args.max_por_cat if args.max_por_cat > 0 else 99999

    t0 = time.time()
    con = psycopg2.connect(**DB_CONFIG)
    cur = con.cursor()

    cur.execute("SELECT DISTINCT c.nombre FROM categorias c "
                "JOIN productos p ON p.categoria_id = c.id "
                "WHERE p.activo = TRUE ORDER BY c.nombre")
    categorias = [r[0] for r in cur.fetchall()]
    log.info("Categorías a procesar: %d  |  máx %d productos c/u", len(categorias), max_cat)
    log.info("Modo: %s", "solo faltantes" if args.solo_faltantes else "todos (sobrescribe)")

    total = ok_epsa = ok_bing = skipped = fallidas = 0
    skus_fallidos: list[str] = []

    for cat in categorias:
        cur.execute("""
            SELECT p.sku, p.nombre, p.descripcion
            FROM productos p
            JOIN categorias c ON c.id = p.categoria_id
            WHERE c.nombre = %s AND p.activo = TRUE
            ORDER BY p.nombre ASC
            LIMIT %s
        """, (cat, max_cat))
        filas = cur.fetchall()
        log.info("── %s  (%d productos)", cat, len(filas))

        for sku, nombre, descripcion in filas:
            total += 1
            marca = ""
            if descripcion:
                m = re.search(r"Marca:\s*([^|]+)", descripcion)
                if m: marca = m.group(1).strip()

            ok, fuente = procesar_producto(sku, nombre, marca, args.solo_faltantes)

            if fuente == "skip":
                skipped += 1
            elif ok and fuente == "epsa":
                ok_epsa += 1
                _actualizar_bd(cur, con, sku)
            elif ok and fuente == "bing":
                ok_bing += 1
                _actualizar_bd(cur, con, sku)
            else:
                fallidas += 1
                skus_fallidos.append(sku)

    cur.close()
    con.close()

    elapsed = time.time() - t0
    print()
    print("=" * 62)
    print("  RESUMEN FINAL")
    print("=" * 62)
    print(f"  Productos procesados       : {total}")
    print(f"  Descargadas desde EPSA     : {ok_epsa}")
    print(f"  Descargadas desde Bing     : {ok_bing}")
    print(f"  Omitidas (ya existían)     : {skipped}")
    print(f"  Fallidas                   : {fallidas}")
    if skus_fallidos:
        print(f"  SKUs sin imagen            : {', '.join(skus_fallidos)}")
    print(f"  Tiempo total               : {elapsed:.0f}s  ({elapsed/60:.1f} min)")
    print("=" * 62)


def _actualizar_bd(cur, con, sku: str):
    try:
        cur.execute("UPDATE productos SET imagen_url = %s, updated_at = NOW() WHERE sku = %s",
                    (f"./img/productos/{sku}.jpg", sku))
        con.commit()
    except Exception as e:
        log.warning("  No se pudo actualizar BD para SKU=%s: %s", sku, e)
        con.rollback()


if __name__ == "__main__":
    main()
