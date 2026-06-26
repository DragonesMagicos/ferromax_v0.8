package com.example.beta1.ui.recepcion

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import coil.request.ImageRequest

@Composable
fun ProductoNuevoDialog(
    codigoBarras: String,
    nombreSugerido: String,
    descripcionSugerida: String?,
    imagenesDisponibles: List<String>,
    cargandoImagenes: Boolean,
    guardando: Boolean,
    onConfirmar: (nombre: String, descripcion: String?, imagenUrl: String?) -> Unit,
    onCancelar: () -> Unit
) {
    var nombre by remember { mutableStateOf(nombreSugerido) }
    var descripcion by remember { mutableStateOf(descripcionSugerida ?: "") }
    var imagenSeleccionada by remember { mutableStateOf<String?>(null) }

    Dialog(
        onDismissRequest = { if (!guardando) onCancelar() },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    "Producto no encontrado",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "Código: $codigoBarras",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                HorizontalDivider()

                Text("Completá los datos del producto:", fontSize = 13.sp, fontWeight = FontWeight.Medium)

                OutlinedTextField(
                    value = nombre,
                    onValueChange = { nombre = it },
                    label = { Text("Nombre del producto") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !guardando,
                    singleLine = true
                )

                OutlinedTextField(
                    value = descripcion,
                    onValueChange = { descripcion = it },
                    label = { Text("Descripción (opcional)") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !guardando,
                    maxLines = 3
                )

                // Imágenes
                Text("Elegí una imagen (opcional):", fontSize = 13.sp, fontWeight = FontWeight.Medium)

                if (cargandoImagenes) {
                    Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else if (imagenesDisponibles.isEmpty()) {
                    Text(
                        "No se encontraron imágenes.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(imagenesDisponibles) { url ->
                            val seleccionada = url == imagenSeleccionada
                            AsyncImage(
                                model = ImageRequest.Builder(LocalContext.current)
                                    .data(url)
                                    .crossfade(true)
                                    .build(),
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(90.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .border(
                                        BorderStroke(
                                            if (seleccionada) 3.dp else 1.dp,
                                            if (seleccionada) MaterialTheme.colorScheme.primary else Color.Gray
                                        ),
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clickable { imagenSeleccionada = if (seleccionada) null else url }
                            )
                        }
                    }
                    if (imagenSeleccionada != null) {
                        Text(
                            "Imagen seleccionada ✓",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                HorizontalDivider()

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onCancelar,
                        modifier = Modifier.weight(1f),
                        enabled = !guardando
                    ) { Text("Cancelar") }

                    Button(
                        onClick = {
                            onConfirmar(
                                nombre.trim(),
                                descripcion.trim().ifBlank { null },
                                imagenSeleccionada
                            )
                        },
                        modifier = Modifier.weight(1f),
                        enabled = nombre.isNotBlank() && !guardando
                    ) {
                        if (guardando) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = Color.White)
                        } else {
                            Text("Crear y agregar")
                        }
                    }
                }
            }
        }
    }
}