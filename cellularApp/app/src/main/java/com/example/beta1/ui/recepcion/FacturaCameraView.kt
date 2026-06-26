package com.example.beta1.ui.recepcion

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.FileProvider
import com.example.beta1.data.remote.GeminiFacturaParser
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.util.concurrent.Executors

data class ItemFacturaParseado(
    val sku: String,
    val cantidadSugerida: Int,
    val lineaOriginal: String
)

private val SKU_REGEX_FACTURA = Regex("""(?=.*[A-Z])(?=.*[0-9])[A-Z0-9][A-Z0-9\-]{2,19}""")
private val CANTIDAD_REGEX = Regex("""(?:^|\s)(\d{1,4})(?:\s|${'$'})""")

private val PALABRAS_EXCLUIDAS = setOf(
    "TOTAL", "SUBTOTAL", "IVA", "NETO", "FECHA", "FACTURA", "REMITO",
    "CUIT", "DOMICILIO", "TELEFONO", "CORREO", "EMAIL", "CONDICION",
    "VENCIMIENTO", "PAGO", "CLIENTE", "PROVEEDOR", "RAZON", "SOCIAL",
    "DIRECCION", "PROVINCIA", "LOCALIDAD", "NUMERO", "COMPROBANTE"
)

private fun parsearLineasFactura(textoOcr: String): List<ItemFacturaParseado> {
    val items = mutableListOf<ItemFacturaParseado>()
    for (linea in textoOcr.lines()) {
        val lineaUpper = linea.trim().uppercase()
        if (lineaUpper.isBlank()) continue
                if (PALABRAS_EXCLUIDAS.any { lineaUpper.contains(it) }) continue
                if (lineaUpper.matches(Regex("""[\d\s/\-\.\${'$'},:%]+"""))) continue

        val skuMatch = SKU_REGEX_FACTURA.find(lineaUpper) ?: continue
        val cantidadMatch = CANTIDAD_REGEX.find(lineaUpper)
        val cantidad = cantidadMatch?.groupValues?.get(1)?.toIntOrNull()?.takeIf { it in 1..9999 } ?: 1
        items.add(ItemFacturaParseado(skuMatch.value, cantidad, linea.trim()))
    }
    return items
}

// ─── Estado del flujo ─────────────────────────────────────────────────────────

sealed class FacturaViewState {
    object Capturando : FacturaViewState()
    object Procesando : FacturaViewState()
    data class Revision(
        val textoCompleto: String,
        val itemsParseados: List<ItemFacturaParseado>
    ) : FacturaViewState()
}

// ─── Vista principal: cámara + flujo de revisión ──────────────────────────────

@Composable
fun FacturaCameraView(
    onItemsConfirmados: (List<ItemFacturaParseado>) -> Unit,
    onCerrar: () -> Unit
) {
    val context = LocalContext.current
    var viewState by remember { mutableStateOf<FacturaViewState>(FacturaViewState.Capturando) }

    when (val s = viewState) {
        is FacturaViewState.Capturando -> {
            FacturaCaptura(
                onFotoTomada = { uri ->
                    viewState = FacturaViewState.Procesando
                    procesarFotoFactura(context, uri) { texto ->
                        CoroutineScope(Dispatchers.Main).launch {
                            val items = GeminiFacturaParser.parsear(texto)
                                .ifEmpty { parsearLineasFactura(texto) }
                            viewState = FacturaViewState.Revision(texto, items)
                        }
                    }
                },
                onCerrar = onCerrar
            )
        }
        is FacturaViewState.Procesando -> {
            Box(modifier = Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    CircularProgressIndicator(color = Color.White)
                    Text("Procesando la imagen...", color = Color.White, fontSize = 16.sp)
                }
            }
        }
        is FacturaViewState.Revision -> {
            FacturaRevision(
                estado = s,
                onConfirmar = { itemsSeleccionados -> onItemsConfirmados(itemsSeleccionados) },
                onVolver = { viewState = FacturaViewState.Capturando }
            )
        }
    }
}

// ─── Pantalla de captura con CameraX ──────────────────────────────────────────

@Composable
private fun FacturaCaptura(
    onFotoTomada: (Uri) -> Unit,
    onCerrar: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val executor = remember { Executors.newSingleThreadExecutor() }
    var imageCaptureRef by remember { mutableStateOf<ImageCapture?>(null) }

    // Archivo temporal para la foto
    val fotoFile = remember { File(context.cacheDir, "factura_temp.jpg") }
    val fotoUri = remember {
        FileProvider.getUriForFile(context, "${context.packageName}.provider", fotoFile)
    }

    // Alternativa: usar galería
    val galeriaLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri -> if (uri != null) onFotoTomada(uri) }

    DisposableEffect(Unit) {
        onDispose { executor.shutdown() }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)

                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val imageCapture = ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .build()
                    imageCaptureRef = imageCapture

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            CameraSelector.DEFAULT_BACK_CAMERA,
                            preview,
                            imageCapture
                        )
                    } catch (e: Exception) {
                        Log.e("FacturaCam", "Error al iniciar cámara", e)
                    }
                }, ctx.mainExecutor)

                previewView
            },
            modifier = Modifier.fillMaxSize()
        )

        // Overlay superior
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp)
                .background(Color.Black.copy(alpha = 0.6f))
                .align(Alignment.TopCenter),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Sacá una foto clara de la factura o remito",
                color = Color.White,
                fontSize = 15.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 24.dp)
            )
        }

        // Botón cerrar
        IconButton(
            onClick = onCerrar,
            modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)
        ) {
            Icon(Icons.Filled.Close, contentDescription = "Cerrar", tint = Color.White, modifier = Modifier.size(32.dp))
        }

        // Controles inferiores
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.Black.copy(alpha = 0.7f))
                .align(Alignment.BottomCenter)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Botón disparador principal
            FilledIconButton(
                onClick = {
                    val capture = imageCaptureRef ?: return@FilledIconButton
                    val outputOptions = ImageCapture.OutputFileOptions.Builder(fotoFile).build()
                    capture.takePicture(
                        outputOptions,
                        executor,
                        object : ImageCapture.OnImageSavedCallback {
                            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                                onFotoTomada(fotoUri)
                            }
                            override fun onError(exc: ImageCaptureException) {
                                Log.e("FacturaCam", "Error al capturar foto", exc)
                            }
                        }
                    )
                },
                modifier = Modifier.size(72.dp),
                colors = IconButtonDefaults.filledIconButtonColors(containerColor = Color.White)
            ) {
                Icon(
                    Icons.Filled.PhotoCamera,
                    contentDescription = "Tomar foto",
                    tint = Color.Black,
                    modifier = Modifier.size(36.dp)
                )
            }

            // Alternativa: elegir de galería
            TextButton(onClick = { galeriaLauncher.launch("image/*") }) {
                Text("Elegir de la galería", color = Color.White, fontSize = 13.sp)
            }
        }
    }
}

// ─── Pantalla de revisión del OCR ─────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FacturaRevision(
    estado: FacturaViewState.Revision,
    onConfirmar: (List<ItemFacturaParseado>) -> Unit,
    onVolver: () -> Unit
) {
    // Mapa: sku -> (seleccionado, cantidad editable)
    val seleccion = remember {
        mutableStateMapOf<String, Boolean>().also { map ->
            estado.itemsParseados.forEach { map[it.sku] = true }
        }
    }
    val cantidades = remember {
        mutableStateMapOf<String, String>().also { map ->
            estado.itemsParseados.forEach { map[it.sku] = it.cantidadSugerida.toString() }
        }
    }
    var mostrarTextoCompleto by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Revisar factura escaneada") },
                navigationIcon = {
                    IconButton(onClick = onVolver) {
                        Icon(Icons.Filled.Close, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (estado.itemsParseados.isEmpty()) {
                // Sin ítems detectados
                Column(
                    modifier = Modifier.weight(1f).padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        "No se detectaron productos en la imagen.",
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "Intentá sacar otra foto con mejor iluminación y la factura bien encuadrada.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )
                    OutlinedButton(onClick = onVolver) { Text("Volver a escanear") }

                    if (estado.textoCompleto.isNotBlank()) {
                        TextButton(onClick = { mostrarTextoCompleto = !mostrarTextoCompleto }) {
                            Text(if (mostrarTextoCompleto) "Ocultar texto detectado" else "Ver texto detectado")
                        }
                        if (mostrarTextoCompleto) {
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Text(
                                    text = estado.textoCompleto,
                                    modifier = Modifier.padding(12.dp).verticalScroll(rememberScrollState()),
                                    fontSize = 11.sp,
                                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            } else {
                // Lista de ítems detectados
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    Text(
                        "${estado.itemsParseados.size} producto(s) detectado(s). Revisá y corregí antes de confirmar.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                androidx.compose.foundation.lazy.LazyColumn(
                    modifier = Modifier.weight(1f).padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    items(estado.itemsParseados.size) { index ->
                        val item = estado.itemsParseados[index]
                        val estaSeleccionado = seleccion[item.sku] ?: true
                        val cantidad = cantidades[item.sku] ?: item.cantidadSugerida.toString()

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = if (estaSeleccionado)
                                    MaterialTheme.colorScheme.secondaryContainer
                                else
                                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Checkbox(
                                    checked = estaSeleccionado,
                                    onCheckedChange = { seleccion[item.sku] = it }
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.sku, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text(
                                        item.lineaOriginal,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 2
                                    )
                                }
                                OutlinedTextField(
                                    value = cantidad,
                                    onValueChange = { cantidades[item.sku] = it },
                                    label = { Text("Cant.") },
                                    singleLine = true,
                                    enabled = estaSeleccionado,
                                    modifier = Modifier.width(80.dp),
                                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                        keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                                    )
                                )
                            }
                        }
                    }
                }

                // Botón confirmar
                val itemsConfirmados = estado.itemsParseados.filter { seleccion[it.sku] == true }
                Button(
                    onClick = {
                        val resultado = itemsConfirmados.map { item ->
                            item.copy(
                                cantidadSugerida = cantidades[item.sku]?.toIntOrNull()?.takeIf { it > 0 }
                                    ?: item.cantidadSugerida
                            )
                        }
                        onConfirmar(resultado)
                    },
                    enabled = itemsConfirmados.isNotEmpty(),
                    modifier = Modifier.fillMaxWidth().padding(16.dp)
                ) {
                    Text("Confirmar ${itemsConfirmados.size} producto(s)")
                }
            }
        }
    }
}

// ─── Procesamiento OCR de una imagen estática ─────────────────────────────────

private fun procesarFotoFactura(context: Context, uri: Uri, onTextoExtraido: (String) -> Unit) {
    try {
        val inputStream = context.contentResolver.openInputStream(uri)
        val bitmap = BitmapFactory.decodeStream(inputStream)
        inputStream?.close()

        if (bitmap == null) {
            onTextoExtraido("")
            return
        }

        val image = InputImage.fromBitmap(bitmap, 0)
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

        recognizer.process(image)
            .addOnSuccessListener { resultado ->
                onTextoExtraido(resultado.text)
            }
            .addOnFailureListener { e ->
                Log.e("FacturaOCR", "Error al procesar imagen", e)
                onTextoExtraido("")
            }
            .addOnCompleteListener {
                recognizer.close()
            }
    } catch (e: Exception) {
        Log.e("FacturaOCR", "Error al leer imagen", e)
        onTextoExtraido("")
    }
}
