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
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors

@Composable
fun BarcodeCameraView(
    onCodigoDetectado: (String) -> Unit,
    onCerrar: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val executor = remember { Executors.newSingleThreadExecutor() }
    var mensajeEstado by remember { mutableStateOf("Apuntá la cámara al código de barras") }
    var procesando by remember { mutableStateOf(false) }

    val scanner = remember { BarcodeScanning.getClient() }

    DisposableEffect(Unit) {
        onDispose {
            scanner.close()
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
                                    procesarBarcode(imageProxy, scanner) { codigo ->
                                        procesando = true
                                        mensajeEstado = "Código detectado: $codigo"
                                        onCodigoDetectado(codigo)
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
                        Log.e("Barcode", "Error al iniciar cámara", e)
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
                .height(160.dp)
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

        // Marco de enfoque horizontal (barcode es ancho)
        Box(
            modifier = Modifier
                .size(280.dp, 100.dp)
                .align(Alignment.Center)
                .border(2.dp, Color(0xFF4CAF50), RoundedCornerShape(8.dp))
        )

        // Línea de escaneo decorativa
        Box(
            modifier = Modifier
                .size(260.dp, 2.dp)
                .align(Alignment.Center)
                .background(Color(0xFF4CAF50).copy(alpha = 0.7f))
        )

        // Overlay oscuro inferior
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .background(Color.Black.copy(alpha = 0.6f))
                .align(Alignment.BottomCenter)
        ) {
            Text(
                text = "EAN-13 · Code-128 · QR · Data Matrix",
                color = Color.White.copy(alpha = 0.6f),
                fontSize = 12.sp,
                modifier = Modifier.align(Alignment.Center)
            )
        }

        // Botón cerrar
        IconButton(
            onClick = onCerrar,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
        ) {
            Icon(
                Icons.Filled.Close,
                contentDescription = "Cerrar",
                tint = Color.White,
                modifier = Modifier.size(32.dp)
            )
        }
    }
}

@androidx.annotation.OptIn(ExperimentalGetImage::class)
private fun procesarBarcode(
    imageProxy: ImageProxy,
    scanner: com.google.mlkit.vision.barcode.BarcodeScanner,
    onCodigoEncontrado: (String) -> Unit
) {
    val mediaImage = imageProxy.image
    if (mediaImage == null) {
        imageProxy.close()
        return
    }

    val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

    scanner.process(image)
        .addOnSuccessListener { barcodes ->
            val codigo = barcodes
                .filter { it.format != Barcode.FORMAT_UNKNOWN }
                .mapNotNull { it.rawValue }
                .firstOrNull()
            if (codigo != null) {
                onCodigoEncontrado(codigo)
            }
        }
        .addOnCompleteListener {
            imageProxy.close()
        }
}
