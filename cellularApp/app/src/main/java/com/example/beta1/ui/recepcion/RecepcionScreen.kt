package com.example.beta1.ui.recepcion

import android.Manifest
import android.app.Application
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DocumentScanner
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.beta1.data.local.TokenDataStore
import com.example.beta1.data.model.*
import com.example.beta1.data.remote.RetrofitClient
import com.example.beta1.data.remote.UpcLookup
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

// ─── Estados ──────────────────────────────────────────────────────────────────

data class DialogoProductoNuevo(
    val codigoBarras: String,
    val nombreSugerido: String,
    val descripcionSugerida: String?,
    val imagenes: List<String> = emptyList(),
    val cargandoImagenes: Boolean = true,
    val guardando: Boolean = false
)

sealed class RecepcionUiState {
    object CargandoProveedores : RecepcionUiState()
    data class EncabezadoRemito(
        val proveedores: List<ProveedorDTO>,
        val proveedorSeleccionado: ProveedorDTO? = null,
        val numeroRemito: String = "",
        val error: String? = null
    ) : RecepcionUiState()

    data class CargandoItems(
        val remito: RemitoLocal,
        val items: List<ItemRemitoLocal> = emptyList(),
        val skuBusqueda: String = "",
        val buscando: Boolean = false,
        val productoEncontrado: ProductoEmpleadoDTO? = null,
        val cantidad: String = "",
        val errorItem: String? = null,
        val mostrarCamara: Boolean = false,
        val mostrarCamaraBarcode: Boolean = false,
        val mostrarCamaraFactura: Boolean = false,
        val colaSku: List<Pair<String, Int>> = emptyList(),
        val dialogoProductoNuevo: DialogoProductoNuevo? = null
    ) : RecepcionUiState()

    data class Resumen(val remito: RemitoLocal) : RecepcionUiState()

    object Error : RecepcionUiState()
}

// ─── ViewModel ────────────────────────────────────────────────────────────────

class RecepcionViewModel(app: Application) : AndroidViewModel(app) {
    private val dataStore = TokenDataStore(app)
    private val _state = MutableStateFlow<RecepcionUiState>(RecepcionUiState.CargandoProveedores)
    val state: StateFlow<RecepcionUiState> = _state

    init { cargarProveedores() }

    private fun cargarProveedores() {
        viewModelScope.launch {
            try {
                val token = "Bearer ${dataStore.token.first() ?: ""}"
                val proveedores = RetrofitClient.api.listarProveedores(token)
                _state.value = RecepcionUiState.EncabezadoRemito(proveedores)
            } catch (e: Exception) {
                // Si el endpoint aún no existe, usar lista vacía para poder probar la UI
                _state.value = RecepcionUiState.EncabezadoRemito(emptyList())
            }
        }
    }

    fun seleccionarProveedor(p: ProveedorDTO) {
        val s = _state.value as? RecepcionUiState.EncabezadoRemito ?: return
        _state.value = s.copy(proveedorSeleccionado = p, error = null)
    }

    fun actualizarNumeroRemito(numero: String) {
        val s = _state.value as? RecepcionUiState.EncabezadoRemito ?: return
        _state.value = s.copy(numeroRemito = numero, error = null)
    }

    fun confirmarEncabezado() {
        val s = _state.value as? RecepcionUiState.EncabezadoRemito ?: return
        if (s.proveedorSeleccionado == null) { _state.value = s.copy(error = "Seleccioná un proveedor"); return }
        if (s.numeroRemito.isBlank()) { _state.value = s.copy(error = "Ingresá el número de remito o factura"); return }
        viewModelScope.launch {
            try {
                val token = "Bearer ${dataStore.token.first() ?: ""}"
                val response = RetrofitClient.api.crearRemito(
                    token,
                    RecepcionRemitoRequest(s.proveedorSeleccionado.id, s.numeroRemito.trim())
                )
                _state.value = RecepcionUiState.CargandoItems(
                    remito = RemitoLocal(response.id, s.proveedorSeleccionado.id, s.proveedorSeleccionado.nombre, s.numeroRemito, emptyList())
                )
            } catch (e: Exception) {
                _state.value = s.copy(error = "Error al registrar el remito. Verificá la conexión.")
            }
        }
    }

    fun actualizarSku(sku: String) {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(skuBusqueda = sku, productoEncontrado = null, errorItem = null)
    }

    fun buscarProducto(sku: String) {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        if (sku.isBlank()) return
        viewModelScope.launch {
            _state.value = s.copy(buscando = true, errorItem = null)
            val token = "Bearer ${dataStore.token.first() ?: ""}"
            val skuUpper = sku.trim().uppercase()
            val producto = intentarBuscarSku(token, skuUpper)
            val currentState = _state.value as? RecepcionUiState.CargandoItems ?: return@launch
            if (producto != null) {
                _state.value = currentState.copy(buscando = false, productoEncontrado = producto, skuBusqueda = producto.sku)
            } else {
                _state.value = currentState.copy(buscando = false, errorItem = "SKU no encontrado: $skuUpper")
            }
        }
    }

    private suspend fun intentarBuscarSku(token: String, sku: String): ProductoEmpleadoDTO? {
                try { return RetrofitClient.api.buscarPorSku(token, sku) } catch (_: Exception) {}
                val skuO2Cero = sku.replace('O', '0')
        if (skuO2Cero != sku) {
            try { return RetrofitClient.api.buscarPorSku(token, skuO2Cero) } catch (_: Exception) {}
        }
                val skuCero2O = sku.replace('0', 'O')
        if (skuCero2O != sku) {
            try { return RetrofitClient.api.buscarPorSku(token, skuCero2O) } catch (_: Exception) {}
        }
        return null
    }

    fun actualizarCantidad(cantidad: String) {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(cantidad = cantidad)
    }

    fun agregarItem() {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        val producto = s.productoEncontrado ?: return
        val cantidad = s.cantidad.toIntOrNull()?.takeIf { it > 0 }
            ?: run { _state.value = s.copy(errorItem = "Ingresá una cantidad válida"); return }

        // Verificar que no esté duplicado
        if (s.items.any { it.productoId == producto.id }) {
            _state.value = s.copy(errorItem = "Este producto ya está en la lista"); return
        }

        viewModelScope.launch {
            try {
                val token = "Bearer ${dataStore.token.first() ?: ""}"
                val response = RetrofitClient.api.registrarRecepcion(
                    token,
                    RecepcionRequest(
                        productoId = producto.id,
                        cantidad = cantidad,
                        notas = "Remito ${s.remito.numeroRemito} — ${s.remito.nombreProveedor}",
                        recepcionRemitoId = s.remito.remitoId
                    )
                )
                val nuevoItem = ItemRemitoLocal(
                    productoId = producto.id,
                    sku = producto.sku,
                    nombreProducto = producto.nombre,
                    cantidad = cantidad,
                    stockAnterior = response.stockAnterior,
                    stockNuevo = response.stockNuevo
                )
                val nuevosItems = s.items + nuevoItem
                _state.value = s.copy(
                    items = nuevosItems,
                    remito = s.remito.copy(items = nuevosItems),
                    skuBusqueda = "",
                    productoEncontrado = null,
                    cantidad = "",
                    errorItem = null
                )
            } catch (e: Exception) {
                _state.value = s.copy(errorItem = "Error al registrar el ingreso")
            }
        }
    }

    fun eliminarItem(productoId: Long) {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        val nuevosItems = s.items.filter { it.productoId != productoId }
        _state.value = s.copy(items = nuevosItems, remito = s.remito.copy(items = nuevosItems))
    }

    fun abrirCamara() {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(mostrarCamara = true)
    }

    fun cerrarCamara() {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(mostrarCamara = false)
    }

    fun onSkuEscaneado(sku: String) {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(mostrarCamara = false, skuBusqueda = sku)
        buscarProducto(sku)
    }

    // ── Barcode ──────────────────────────────────────────────────────────────

    fun abrirCamaraBarcode() {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(mostrarCamaraBarcode = true)
    }

    fun cerrarCamaraBarcode() {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(mostrarCamaraBarcode = false)
    }

    fun onBarcodeEscaneado(codigo: String) {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(mostrarCamaraBarcode = false, buscando = true, errorItem = null)
        viewModelScope.launch {
            try {
                val token = "Bearer ${dataStore.token.first() ?: ""}"
                val producto = RetrofitClient.api.buscarPorBarcode(token, codigo)
                _state.value = (_state.value as? RecepcionUiState.CargandoItems ?: return@launch)
                    .copy(buscando = false, productoEncontrado = producto, skuBusqueda = producto.sku)
            } catch (e: Exception) {
                // Producto no encontrado — buscar en UPC Item DB
                buscarProductoExterno(codigo)
            }
        }
    }

    private fun buscarProductoExterno(codigoBarras: String) {
        viewModelScope.launch {
            val info = UpcLookup.buscar(codigoBarras)
            val nombre = info?.nombre ?: "Producto $codigoBarras"
            val descripcion = buildString {
                info?.marca?.let { append("Marca: $it") }
                info?.descripcion?.let { if (isNotEmpty()) append(" — "); append(it) }
            }.ifBlank { null }

            val dialogo = DialogoProductoNuevo(
                codigoBarras = codigoBarras,
                nombreSugerido = nombre,
                descripcionSugerida = descripcion,
                cargandoImagenes = true
            )
            _state.value = (_state.value as? RecepcionUiState.CargandoItems ?: return@launch)
                .copy(buscando = false, dialogoProductoNuevo = dialogo)

            // Cargar imágenes en paralelo
            try {
                val token = "Bearer ${dataStore.token.first() ?: ""}"
                val imagenes = RetrofitClient.api.buscarImagenes(token, nombre)
                val s = _state.value as? RecepcionUiState.CargandoItems ?: return@launch
                _state.value = s.copy(
                    dialogoProductoNuevo = s.dialogoProductoNuevo?.copy(
                        imagenes = imagenes.take(5),
                        cargandoImagenes = false
                    )
                )
            } catch (e: Exception) {
                val s = _state.value as? RecepcionUiState.CargandoItems ?: return@launch
                _state.value = s.copy(
                    dialogoProductoNuevo = s.dialogoProductoNuevo?.copy(cargandoImagenes = false)
                )
            }
        }
    }

    fun cerrarDialogoProductoNuevo() {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(dialogoProductoNuevo = null, buscando = false)
    }

    fun crearProductoNuevoYAgregar(nombre: String, descripcion: String?, imagenUrl: String?) {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        val dialogo = s.dialogoProductoNuevo ?: return
        _state.value = s.copy(dialogoProductoNuevo = dialogo.copy(guardando = true))
        viewModelScope.launch {
            try {
                val token = "Bearer ${dataStore.token.first() ?: ""}"
                val nuevo = RetrofitClient.api.crearProductoRapido(
                    token,
                    ProductoRapidoRequest(
                        codigoBarras = dialogo.codigoBarras,
                        nombre = nombre,
                        descripcion = descripcion,
                        imagenUrl = imagenUrl
                    )
                )
                // Registrar recepción con cantidad 1 por defecto (el empleado puede cambiarla después)
                val currentState = _state.value as? RecepcionUiState.CargandoItems ?: return@launch
                _state.value = currentState.copy(
                    dialogoProductoNuevo = null,
                    productoEncontrado = nuevo,
                    skuBusqueda = nuevo.sku,
                    cantidad = "",
                    errorItem = null
                )
            } catch (e: Exception) {
                val currentState = _state.value as? RecepcionUiState.CargandoItems ?: return@launch
                _state.value = currentState.copy(
                    dialogoProductoNuevo = currentState.dialogoProductoNuevo?.copy(guardando = false),
                    errorItem = "Error al crear el producto: ${e.message}"
                )
            }
        }
    }

    // ── Foto de factura ───────────────────────────────────────────────────────

    fun abrirCamaraFactura() {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(mostrarCamaraFactura = true)
    }

    fun cerrarCamaraFactura() {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(mostrarCamaraFactura = false, colaSku = emptyList())
    }

    fun onItemsFacturaConfirmados(items: List<ItemFacturaParseado>) {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = s.copy(
            mostrarCamaraFactura = false,
            colaSku = items.map { it.sku to it.cantidadSugerida }
        )
        procesarColaSku()
    }

    private fun procesarColaSku() {
        viewModelScope.launch {
            while (true) {
                val s = _state.value as? RecepcionUiState.CargandoItems ?: break
                val pendiente = s.colaSku.firstOrNull() ?: break
                val (sku, cantidad) = pendiente

                // Verificar duplicado
                if (s.items.any { it.sku.equals(sku, ignoreCase = true) }) {
                    _state.value = s.copy(colaSku = s.colaSku.drop(1))
                    continue
                }

                try {
                    val token = "Bearer ${dataStore.token.first() ?: ""}"
                    val producto = RetrofitClient.api.buscarPorSku(token, sku.trim().uppercase())
                    val response = RetrofitClient.api.registrarRecepcion(
                        token,
                        RecepcionRequest(
                            productoId = producto.id,
                            cantidad = cantidad,
                            notas = "Factura escaneada — Remito ${s.remito.numeroRemito}",
                            recepcionRemitoId = s.remito.remitoId
                        )
                    )
                    val currentState = _state.value as? RecepcionUiState.CargandoItems ?: break
                    val nuevoItem = ItemRemitoLocal(
                        productoId = producto.id,
                        sku = producto.sku,
                        nombreProducto = producto.nombre,
                        cantidad = cantidad,
                        stockAnterior = response.stockAnterior,
                        stockNuevo = response.stockNuevo
                    )
                    val nuevosItems = currentState.items + nuevoItem
                    _state.value = currentState.copy(
                        items = nuevosItems,
                        remito = currentState.remito.copy(items = nuevosItems),
                        colaSku = currentState.colaSku.drop(1),
                        errorItem = null
                    )
                } catch (e: Exception) {
                    val currentState = _state.value as? RecepcionUiState.CargandoItems ?: break
                    // SKU no encontrado: saltar y avisar
                    _state.value = currentState.copy(
                        colaSku = currentState.colaSku.drop(1),
                        errorItem = "SKU no encontrado en sistema: $sku"
                    )
                }
            }
        }
    }

    fun finalizarRemito() {
        val s = _state.value as? RecepcionUiState.CargandoItems ?: return
        _state.value = RecepcionUiState.Resumen(s.remito)
    }

    fun nuevoRemito() { cargarProveedores() }
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecepcionScreen(onVolver: () -> Unit) {
    val viewModel: RecepcionViewModel = viewModel()
    val state by viewModel.state.collectAsState()

    // Cámara OCR texto (SKU) — pantalla completa
    if (state is RecepcionUiState.CargandoItems && (state as RecepcionUiState.CargandoItems).mostrarCamara) {
        OcrCameraView(
            onSkuDetectado = { viewModel.onSkuEscaneado(it) },
            onCerrar = { viewModel.cerrarCamara() }
        )
        return
    }

    // Cámara Barcode — pantalla completa
    if (state is RecepcionUiState.CargandoItems && (state as RecepcionUiState.CargandoItems).mostrarCamaraBarcode) {
        BarcodeCameraView(
            onCodigoDetectado = { viewModel.onBarcodeEscaneado(it) },
            onCerrar = { viewModel.cerrarCamaraBarcode() }
        )
        return
    }

    // Cámara Factura — pantalla completa
    if (state is RecepcionUiState.CargandoItems && (state as RecepcionUiState.CargandoItems).mostrarCamaraFactura) {
        FacturaCameraView(
            onItemsConfirmados = { viewModel.onItemsFacturaConfirmados(it) },
            onCerrar = { viewModel.cerrarCamaraFactura() }
        )
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(when (state) {
                        is RecepcionUiState.EncabezadoRemito -> "Nueva Recepción"
                        is RecepcionUiState.CargandoItems -> "Cargando ítems"
                        is RecepcionUiState.Resumen -> "Recepción registrada"
                        else -> "Recepción"
                    })
                },
                navigationIcon = {
                    IconButton(onClick = onVolver) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (val s = state) {
                is RecepcionUiState.CargandoProveedores -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is RecepcionUiState.EncabezadoRemito -> PasoEncabezado(s, viewModel)
                is RecepcionUiState.CargandoItems -> {
                    PasoCargaItems(s, viewModel)
                    s.dialogoProductoNuevo?.let { dialogo ->
                        ProductoNuevoDialog(
                            codigoBarras = dialogo.codigoBarras,
                            nombreSugerido = dialogo.nombreSugerido,
                            descripcionSugerida = dialogo.descripcionSugerida,
                            imagenesDisponibles = dialogo.imagenes,
                            cargandoImagenes = dialogo.cargandoImagenes,
                            guardando = dialogo.guardando,
                            onConfirmar = { nombre, desc, img ->
                                viewModel.crearProductoNuevoYAgregar(nombre, desc, img)
                            },
                            onCancelar = { viewModel.cerrarDialogoProductoNuevo() }
                        )
                    }
                }
                is RecepcionUiState.Resumen -> PasoResumen(s, viewModel)
                is RecepcionUiState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Error. Intentá de nuevo.", color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}

// ─── Paso 1: Encabezado del remito ────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PasoEncabezado(state: RecepcionUiState.EncabezadoRemito, viewModel: RecepcionViewModel) {
    var expandido by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Datos del remito", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(
            "Ingresá el proveedor y el número de remito o factura. " +
            "El administrador verificará contra el documento físico.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        // Selector de proveedor
        ExposedDropdownMenuBox(
            expanded = expandido,
            onExpandedChange = { expandido = !expandido }
        ) {
            OutlinedTextField(
                value = state.proveedorSeleccionado?.nombre ?: "",
                onValueChange = {},
                readOnly = true,
                label = { Text("Proveedor") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandido) },
                modifier = Modifier.fillMaxWidth().menuAnchor()
            )
            ExposedDropdownMenu(
                expanded = expandido,
                onDismissRequest = { expandido = false }
            ) {
                if (state.proveedores.isEmpty()) {
                    DropdownMenuItem(
                        text = { Text("Sin proveedores cargados", color = MaterialTheme.colorScheme.onSurfaceVariant) },
                        onClick = {}
                    )
                } else {
                    state.proveedores.forEach { proveedor ->
                        DropdownMenuItem(
                            text = { Text(proveedor.nombre) },
                            onClick = { viewModel.seleccionarProveedor(proveedor); expandido = false }
                        )
                    }
                }
            }
        }

        // Número de remito
        OutlinedTextField(
            value = state.numeroRemito,
            onValueChange = { viewModel.actualizarNumeroRemito(it) },
            label = { Text("Número de remito / factura") },
            placeholder = { Text("Ej: 00012-00037460") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
        }

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = { viewModel.confirmarEncabezado() },
            modifier = Modifier.fillMaxWidth(),
            enabled = state.proveedorSeleccionado != null && state.numeroRemito.isNotBlank()
        ) {
            Text("Continuar — Cargar productos")
        }
    }
}

// ─── Paso 2: Carga de ítems ───────────────────────────────────────────────────

@Composable
private fun PasoCargaItems(state: RecepcionUiState.CargandoItems, viewModel: RecepcionViewModel) {
    // Guardamos qué modo de cámara quiere abrir el usuario mientras espera el permiso
    var modoCamaraPendiente by remember { mutableStateOf("") }

    val permisoCamara = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { concedido ->
        if (concedido) {
            when (modoCamaraPendiente) {
                "barcode" -> viewModel.abrirCamaraBarcode()
                "factura" -> viewModel.abrirCamaraFactura()
                else -> viewModel.abrirCamara()
            }
        }
        modoCamaraPendiente = ""
    }

    Column(modifier = Modifier.fillMaxSize()) {

        // Encabezado del remito activo
        Surface(color = MaterialTheme.colorScheme.primaryContainer) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(state.remito.nombreProveedor, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Remito: ${state.remito.numeroRemito}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onPrimaryContainer)
                }
                Text("${state.items.size} ítem(s)", fontSize = 13.sp, fontWeight = FontWeight.Medium)
            }
        }

        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {

            // Botones de cámara: SKU OCR | Código de barras | Foto factura
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        modoCamaraPendiente = "sku"
                        permisoCamara.launch(Manifest.permission.CAMERA)
                    },
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Filled.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("SKU", fontSize = 12.sp)
                }
                OutlinedButton(
                    onClick = {
                        modoCamaraPendiente = "barcode"
                        permisoCamara.launch(Manifest.permission.CAMERA)
                    },
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Filled.QrCodeScanner, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Código", fontSize = 12.sp)
                }
                OutlinedButton(
                    onClick = {
                        modoCamaraPendiente = "factura"
                        permisoCamara.launch(Manifest.permission.CAMERA)
                    },
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Filled.DocumentScanner, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Factura", fontSize = 12.sp)
                }
            }

            // Indicador de carga en lote (mientras procesa la cola de factura)
            if (state.colaSku.isNotEmpty()) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                Text(
                    "Cargando productos de la factura… (${state.colaSku.size} pendiente(s))",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            // Búsqueda por SKU
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = state.skuBusqueda,
                    onValueChange = { viewModel.actualizarSku(it) },
                    label = { Text("SKU del producto") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    enabled = !state.buscando
                )
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = { viewModel.buscarProducto(state.skuBusqueda) },
                    enabled = state.skuBusqueda.isNotBlank() && !state.buscando
                ) {
                    if (state.buscando) CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    else Text("Buscar")
                }
            }

            // Producto encontrado
            state.productoEncontrado?.let { producto ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(producto.nombre, fontWeight = FontWeight.Bold)
                        Text("SKU: ${producto.sku}  ·  Stock actual: ${producto.stockActual} u", fontSize = 12.sp)
                        producto.categoria?.let { Text("Categoría: $it", fontSize = 12.sp) }
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = state.cantidad,
                        onValueChange = { viewModel.actualizarCantidad(it) },
                        label = { Text("Cantidad recibida") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    Button(
                        onClick = { viewModel.agregarItem() },
                        enabled = state.cantidad.isNotBlank()
                    ) { Text("Agregar") }
                }
            }

            state.errorItem?.let {
                Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
            }
        }

        HorizontalDivider()

        // Lista de ítems cargados
        if (state.items.isEmpty()) {
            Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                Text("Sin productos cargados aún", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f).padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
                contentPadding = PaddingValues(vertical = 10.dp)
            ) {
                items(state.items, key = { it.productoId }) { item ->
                    ItemRemitoCard(item, onEliminar = { viewModel.eliminarItem(item.productoId) })
                }
            }
        }

        // Botón finalizar
        Button(
            onClick = { viewModel.finalizarRemito() },
            enabled = state.items.isNotEmpty(),
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) { Text("Finalizar recepción (${state.items.size} productos)") }
    }
}

@Composable
private fun ItemRemitoCard(item: ItemRemitoLocal, onEliminar: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(item.nombreProducto, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                Text("SKU: ${item.sku}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    "Cant: ${item.cantidad}  ·  Stock: ${item.stockAnterior} → ${item.stockNuevo}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            IconButton(onClick = onEliminar) {
                Icon(Icons.Filled.Delete, contentDescription = "Eliminar", tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}

// ─── Paso 3: Resumen ──────────────────────────────────────────────────────────

@Composable
private fun PasoResumen(state: RecepcionUiState.Resumen, viewModel: RecepcionViewModel) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Ícono de éxito
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            Icon(
                Icons.Filled.CheckCircle,
                contentDescription = null,
                tint = Color(0xFF2E7D32),
                modifier = Modifier.size(64.dp)
            )
        }

        Text(
            "Recepción registrada",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.align(Alignment.CenterHorizontally)
        )

        // Datos del remito
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Proveedor: ${state.remito.nombreProveedor}", fontWeight = FontWeight.Medium)
                Text("Remito / Factura: ${state.remito.numeroRemito}")
                Text("${state.remito.items.size} producto(s) ingresado(s) al stock")
            }
        }

        // Detalle de ítems
        Text("Detalle:", fontWeight = FontWeight.Medium)
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(state.remito.items) { item ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.nombreProducto, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            Text("SKU: ${item.sku}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("+${item.cantidad}", fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                            Text("Stock: ${item.stockNuevo}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }

        // Aviso de pendiente confirmación admin
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer)
        ) {
            Text(
                "⏳ Pendiente de confirmación por el administrador con la factura física.",
                modifier = Modifier.padding(12.dp),
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onTertiaryContainer
            )
        }

        Button(
            onClick = { viewModel.nuevoRemito() },
            modifier = Modifier.fillMaxWidth()
        ) { Text("Nueva recepción") }
    }
}
