package com.example.beta1.ui.recepcion

import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.util.concurrent.Executors

// Patrón SKU: letras/números, puede contener guiones, entre 3 y 20 caracteres
private val SKU_REGEX = Regex("""[A-Z0-9][A-Z0-9\-]{2,19}""")

@Composable
fun OcrCameraView(
    onSkuDetectado: (String) -> Unit,
    onCerrar: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val executor = remember { Executors.newSingleThreadExecutor() }
    var mensajeEstado by remember { mutableStateOf("Apuntá la cámara al SKU del producto") }
    var procesando by remember { mutableStateOf(false) }

    val recognizer = remember {
        TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    }

    DisposableEffect(Unit) {
        onDispose {
            recognizer.close()
            executor.shutdown()
        }
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

                    val imageAnalyzer = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also { analysis ->
                            analysis.setAnalyzer(executor) { imageProxy ->
                                if (!procesando) {
                                    procesarFrame(imageProxy, recognizer) { skuEncontrado ->
                                        procesando = true
                                        mensajeEstado = "SKU detectado: $skuEncontrado"
                                        onSkuDetectado(skuEncontrado)
                                    }
                                } else {
                                    imageProxy.close()
                                }
                            }
                        }

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            CameraSelector.DEFAULT_BACK_CAMERA,
                            preview,
                            imageAnalyzer
                        )
                    } catch (e: Exception) {
                        Log.e("OCR", "Error al iniciar cámara", e)
                    }
                }, ctx.mainExecutor)

                previewView
            },
            modifier = Modifier.fillMaxSize()
        )

        // Overlay oscuro superior
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .background(Color.Black.copy(alpha = 0.6f))
                .align(Alignment.TopCenter),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = mensajeEstado,
                color = Color.White,
                fontSize = 16.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 24.dp)
            )
        }

        // Marco de enfoque central
        Box(
            modifier = Modifier
                .size(220.dp, 80.dp)
                .align(Alignment.Center)
                .border(2.dp, Color(0xFFFF6B35), RoundedCornerShape(8.dp))
        )

        // Overlay oscuro inferior
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .background(Color.Black.copy(alpha = 0.6f))
                .align(Alignment.BottomCenter)
        )

        // Botón cerrar
        IconButton(
            onClick = onCerrar,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
        ) {
            Icon(
                Icons.Filled.Close,
                contentDescription = "Cerrar cámara",
                tint = Color.White,
                modifier = Modifier.size(32.dp)
            )
        }
    }
}

@androidx.annotation.OptIn(ExperimentalGetImage::class)
private fun procesarFrame(
    imageProxy: ImageProxy,
    recognizer: com.google.mlkit.vision.text.TextRecognizer,
    onSkuEncontrado: (String) -> Unit
) {
    val mediaImage = imageProxy.image
    if (mediaImage == null) {
        imageProxy.close()
        return
    }

    val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

    recognizer.process(image)
        .addOnSuccessListener { resultado ->
            val candidatos = mutableListOf<String>()
            for (bloque in resultado.textBlocks) {
                for (linea in bloque.lines) {
                    val texto = linea.text.trim().uppercase()
                    val match = SKU_REGEX.find(texto)
                    if (match != null) {
                        candidatos.add(match.value)
                    }
                }
            }
            // Tomar el candidato más largo (suele ser el SKU completo)
            val mejor = candidatos.maxByOrNull { it.length }
            if (mejor != null) {
                onSkuEncontrado(mejor)
            }
        }
        .addOnCompleteListener {
            imageProxy.close()
        }
}
