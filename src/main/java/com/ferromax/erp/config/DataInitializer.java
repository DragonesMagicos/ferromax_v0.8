package com.ferromax.erp.config;

import com.ferromax.erp.model.AlertaStock;
import com.ferromax.erp.model.Categoria;
import com.ferromax.erp.model.Cliente;
import com.ferromax.erp.model.Producto;
import com.ferromax.erp.model.Proveedor;
import com.ferromax.erp.model.RolEnum;
import com.ferromax.erp.model.Usuario;
import com.ferromax.erp.repository.AlertaStockRepository;
import com.ferromax.erp.repository.CategoriaRepository;
import com.ferromax.erp.repository.ClienteRepository;
import com.ferromax.erp.repository.ProductoRepository;
import com.ferromax.erp.repository.ProveedorRepository;
import com.ferromax.erp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;
    private final AlertaStockRepository alertaStockRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (clienteRepository.count() == 0) {
            clienteRepository.save(cliente("Lucas",        "Martínez",         "lucas.martinez@gmail.com",      "20-35678901-2", "11-4523-8901", "Consumidor Final",       "0.00"));
            clienteRepository.save(cliente("Valentina",    "López",            "valen.lopez@hotmail.com",       "27-29876543-4", "11-3341-2290", "Consumidor Final",     "1500.00"));
            clienteRepository.save(cliente("Martín",       "García",           "martin.garcia@yahoo.com",       "20-28123456-7", "11-6678-4432", "Responsable Inscripto",  "0.00"));
            clienteRepository.save(cliente("Sofía",        "Rodríguez",        "sofia.rodriguez@gmail.com",     "27-33445566-1", "11-5590-1234", "Consumidor Final",     "3200.00"));
            clienteRepository.save(cliente("Constructora", "Del Norte SA",     "compras@delnortesa.com.ar",     "30-71234567-9", "11-4890-5566", "Responsable Inscripto","15000.00"));
            clienteRepository.save(cliente("Diego",        "Fernández",        "diegof@outlook.com",            "20-31234567-8", "11-2244-7788", "Consumidor Final",       "0.00"));
            clienteRepository.save(cliente("Distribuidora","El Tornillo SRL",  "admin@eltornillo.com.ar",       "30-68901234-5", "11-4001-9988", "Responsable Inscripto", "8750.00"));
            clienteRepository.save(cliente("Ana",          "Sánchez",          "anita.sanchez@gmail.com",       "27-30112233-6", "11-7823-4456", "Consumidor Final",      "500.00"));
            clienteRepository.save(cliente("Roberto",      "Pereyra",          "roberto.pereyra@gmail.com",     "20-26789012-3", "11-3309-8871", "Consumidor Final",       "0.00"));
            clienteRepository.save(cliente("Obra",         "Construcciones JR","jr.construcciones@gmail.com",  "30-70890123-4", "11-6612-3344", "Responsable Inscripto","22000.00"));
            log.info("✅ 10 clientes de prueba cargados en Ferromax");
        }

        productoRepository.findAll().forEach(p -> {
            if (p.getImagenUrl() != null && p.getImagenUrl().endsWith(".jpg") && p.getImagenUrl().startsWith("/img/product-")) {
                p.setImagenUrl(p.getImagenUrl().replace(".jpg", "-removebg-preview.png"));
                productoRepository.save(p);
            }
        });

        if (usuarioRepository.count() > 0) {
            return;
        }

        // ── Usuarios ──────────────────────────────────────────────────────────
        Usuario admin = new Usuario();
        admin.setNombre("José");
        admin.setApellido("Rodríguez");
        admin.setEmail("jose@ferromax.com");
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setRol(RolEnum.ADMIN);
        admin.setActivo(true);
        usuarioRepository.save(admin);

        Usuario empleado = new Usuario();
        empleado.setNombre("Manuel");
        empleado.setApellido("Casas");
        empleado.setEmail("manuel@ferromax.com");
        empleado.setPasswordHash(passwordEncoder.encode("empleado123"));
        empleado.setRol(RolEnum.EMPLEADO);
        empleado.setActivo(true);
        usuarioRepository.save(empleado);

        // ── Categorías ────────────────────────────────────────────────────────
        Categoria catAmoladoras    = cat("Amoladoras");
        Categoria catTaladros      = cat("Taladros");
        Categoria catSierras       = cat("Sierras");
        Categoria catLijadoras     = cat("Lijadoras");
        Categoria catSoldadura     = cat("Soldadura");
        Categoria catCompresores   = cat("Compresores");
        Categoria catMotosierras   = cat("Motosierras");
        Categoria catCalor         = cat("Pistolas de Calor");
        Categoria catMartillos     = cat("Martillos y Demoledores");
        Categoria catLimpieza      = cat("Limpieza Industrial");
        Categoria catJardineria    = cat("Jardín");

        // ── Proveedor ─────────────────────────────────────────────────────────
        Proveedor proveedor = new Proveedor();
        proveedor.setNombre("Distribuidora Ferretera SA");
        proveedor.setEmail("ventas@distribuidora.com");
        proveedorRepository.save(proveedor);

        // ── Productos ─────────────────────────────────────────────────────────
        Producto p1 = producto(
            "AMO-115-VERSA", "Amoladora Angular 115mm Versa Max",
            "Amoladora angular profesional 115mm, 720W. Ideal para corte y desbaste en metal y mampostería. Mango antivibración, protección de seguridad incluida.",
            "72500.00", 18, 5, catAmoladoras, proveedor, "/img/product-1-removebg-preview.png"
        );

        Producto p2 = producto(
            "TAL-13-PERC", "Taladro Percutor 13mm 850W",
            "Taladro percutor con mandril de 13mm y chuck sin llave. 850W, doble velocidad, función percutor para hormigón. Incluye mango lateral.",
            "95800.00", 12, 4, catTaladros, proveedor, "/img/product-2-removebg-preview.png"
        );

        Producto p3 = producto(
            "SIE-CIRC-180", "Sierra Circular 7¼\" 1400W",
            "Sierra circular profesional con disco de 7¼\" (180mm). 1400W, base de aluminio ajustable 0°–45°, guía paralela incluida. Profundidad de corte máx. 63mm.",
            "118900.00", 8, 3, catSierras, proveedor, "/img/product-3-removebg-preview.png"
        );

        Producto p4 = producto(
            "LIJ-ORB-125", "Lijadora Orbital 125mm 300W",
            "Lijadora orbital excéntrica 125mm, 300W. Plato de goma con sistema de extracción de polvo. Bolsa recolectora incluida. Ideal para madera y revoques.",
            "58600.00", 15, 5, catLijadoras, proveedor, "/img/product-4-removebg-preview.png"
        );

        Producto p5 = producto(
            "SOL-WELD-250", "Soldadora Inversora WeldPro 2500",
            "Soldadora inversora MMA/TIG 250A. Display digital, regulación electrónica, factor de marcha 60%. Incluye cables de masa y porta-electrodo. 220V.",
            "289000.00", 5, 2, catSoldadura, proveedor, "/img/product-5-removebg-preview.png"
        );

        Producto p6 = producto(
            "COMP-50L-2HP", "Compresor de Aire 50 Litros 2HP",
            "Compresor vertical 50 litros, motor 2HP (1500W). Presión máx. 8 bar, caudal 165 l/min. Manómetros duales, válvula de seguridad, portátil con ruedas.",
            "195000.00", 6, 3, catCompresores, proveedor, "/img/product-6-removebg-preview.png"
        );

        Producto p7 = producto(
            "MOT-45CC-2T", "Motosierra 45cc 2-Stroke",
            "Motosierra a nafta 45cc, motor 2 tiempos. Espada de 18\" (45cm), cadena de paso 3/8\". Arranque fácil, sistema anti-vibración, freno de cadena de seguridad.",
            "225000.00", 4, 2, catMotosierras, proveedor, "/img/product-7-removebg-preview.png"
        );

        Producto p8 = producto(
            "PIS-CAL-2000W", "Pistola de Calor 2000W LCD",
            "Pistola de calor digital 2000W con display LCD. 2 velocidades de caudal, temperatura ajustable 50°–650°C. Protección sobrecalentamiento. Incluye 4 boquillas.",
            "48900.00", 20, 6, catCalor, proveedor, "/img/product-8-removebg-preview.png"
        );

        Producto p9 = producto(
            "MAR-SDS-1500", "Martillo Demoledor SDS-MAX 1500W",
            "Martillo demoledor profesional SDS-MAX, 1500W, 45J de energía de impacto. Ideal para demolición en hormigón armado. Incluye 3 cinceles y maletín.",
            "345000.00", 3, 2, catMartillos, proveedor, "/img/product-9-removebg-preview.png"
        );

        Producto p10 = producto(
            "LUS-PISO-1600", "Lustradora de Pisos 1600W",
            "Lustradora industrial 1600W, disco de 17\" (43cm), 180 RPM. Perfecta para pulido y encerado de pisos de mármol, granito y cerámica. Mango regulable.",
            "178500.00", 4, 2, catLimpieza, proveedor, "/img/product-10-removebg-preview.png"
        );

        Producto p11 = producto(
            "CORT-CESPED-1600", "Cortadora de Césped Eléctrica 1600W",
            "Cortadora de césped eléctrica 1600W, ancho de corte 40cm. Altura regulable 6 posiciones (25–75mm). Bolsa colectora 40L, ruedas traseras grandes.",
            "142000.00", 7, 3, catJardineria, proveedor, "/img/product-11-removebg-preview.png"
        );

        Producto p12 = producto(
            "TAL-INAALAM-18V", "Taladro Inalámbrico Pro-Drill 18V",
            "Taladro/atornillador inalámbrico 18V Li-Ion, 4.0Ah. 21 posiciones de torque, 2 velocidades, chuck 13mm. Incluye 2 baterías y cargador rápido.",
            "185000.00", 10, 4, catTaladros, proveedor, "/img/product-12-removebg-preview.png"
        );

        // ── Alertas para productos con stock bajo ─────────────────────────────
        alertaStockRepository.save(alertaCritica(p5, admin));
        alertaStockRepository.save(alertaCritica(p7, admin));
        alertaStockRepository.save(alertaCritica(p9, admin));

        log.info("✅ Datos iniciales de Ferromax cargados correctamente (12 productos con imágenes)");
    }

    private Categoria cat(String nombre) {
        Categoria c = new Categoria();
        c.setNombre(nombre);
        return categoriaRepository.save(c);
    }

    private Producto producto(String sku, String nombre, String descripcion,
                              String precio, int stock, int stockMin,
                              Categoria categoria, Proveedor proveedor, String imagenUrl) {
        Producto p = new Producto();
        p.setSku(sku);
        p.setNombre(nombre);
        p.setDescripcion(descripcion);
        p.setPrecio(new BigDecimal(precio));
        p.setStockActual(stock);
        p.setStockMinimo(stockMin);
        p.setCategoria(categoria);
        p.setProveedor(proveedor);
        p.setImagenUrl(imagenUrl);
        return productoRepository.save(p);
    }

    private Cliente cliente(String nombre, String apellido, String email,
                            String cuit, String telefono, String condicionIva, String saldo) {
        Cliente c = new Cliente();
        c.setNombre(nombre);
        c.setApellido(apellido);
        c.setEmail(email);
        c.setCuit(cuit);
        c.setTelefono(telefono);
        c.setCondicionIva(condicionIva);
        c.setSaldoCuenta(new BigDecimal(saldo));
        return c;
    }

    private AlertaStock alertaCritica(Producto producto, Usuario usuario) {
        AlertaStock alerta = new AlertaStock();

        alerta.setProducto(producto);
        alerta.setAlertaEnum("STOCK_CRITICO");
        alerta.setLida(false);

        // ESTA ES LA LÍNEA QUE FALTA
        alerta.setGeneradaPor(usuario);

        return alerta;
    }
}
