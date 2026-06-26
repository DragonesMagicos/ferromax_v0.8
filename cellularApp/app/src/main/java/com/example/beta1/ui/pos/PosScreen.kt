package com.example.beta1.ui.pos

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.beta1.data.model.VentaDetalleResponse
import com.example.beta1.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PosScreen(
    onVerStock: () -> Unit,
    onVerRecepcion: () -> Unit,
    onCerrarSesion: () -> Unit
) {
    val viewModel: PosViewModel = viewModel()
    val state by viewModel.state.collectAsState()
    val nombre by viewModel.nombre.collectAsState(initial = "")

    var mostrarDialogoCobro by remember { mutableStateOf(false) }
    var medioPagoSeleccionado by remember { mutableStateOf("EFECTIVO") }
    var skuInput by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "POS — ${nombre ?: ""}",
                        fontFamily = RajdhaniFamily,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 20.sp
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = FerromaxDark,
                    titleContentColor = Color.White,
                    actionIconContentColor = Color.White
                ),
                actions = {
                    TextButton(onClick = onVerStock) {
                        Text("Stock", color = Color.White.copy(alpha = 0.8f), fontFamily = InterFamily, fontSize = 13.sp)
                    }
                    TextButton(onClick = onVerRecepcion) {
                        Text("Recepción", color = Color.White.copy(alpha = 0.8f), fontFamily = InterFamily, fontSize = 13.sp)
                    }
                    TextButton(onClick = { viewModel.cerrarSesion(onCerrarSesion) }) {
                        Text("Salir", color = FerromaxNaranja, fontFamily = InterFamily, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            )
        },
        containerColor = FerromaxSurface
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Buscador SKU
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = skuInput,
                        onValueChange = { skuInput = it },
                        label = { Text("Buscar por SKU", fontFamily = InterFamily, fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = FerromaxNaranja,
                            focusedLabelColor = FerromaxNaranja,
                            cursorColor = FerromaxNaranja,
                        )
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { viewModel.buscarPorSku(skuInput) },
                        enabled = skuInput.isNotBlank(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = FerromaxNaranja)
                    ) { Text("Buscar", fontFamily = InterFamily, fontWeight = FontWeight.SemiBold) }
                }
            }

            state.errorBusqueda?.let {
                Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp, fontFamily = InterFamily)
            }

            state.productoBuscado?.let { producto ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(producto.nombre, fontWeight = FontWeight.SemiBold, fontFamily = InterFamily, fontSize = 15.sp, color = FerromaxDark)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                "SKU: ${producto.sku}  ·  Stock: ${producto.stockActual}",
                                fontSize = 12.sp,
                                fontFamily = JetBrainsMonoFamily,
                                color = FerromaxGris
                            )
                            Text(
                                "$ ${"%.2f".format(producto.precio)}",
                                fontSize = 16.sp,
                                fontFamily = RajdhaniFamily,
                                fontWeight = FontWeight.Bold,
                                color = FerromaxNaranja
                            )
                        }
                        Button(
                            onClick = { viewModel.agregarAlCarrito(producto); skuInput = "" },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = FerromaxNaranja)
                        ) { Text("Agregar", fontFamily = InterFamily, fontWeight = FontWeight.SemiBold) }
                    }
                }
            }

            // Carrito
            Card(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Carrito",
                        fontFamily = RajdhaniFamily,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 18.sp,
                        color = FerromaxDark
                    )
                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = FerromaxGrisClaro)

                    if (state.carrito.isEmpty()) {
                        Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                            Text("Sin productos", color = FerromaxGris, fontFamily = InterFamily, fontSize = 13.sp)
                        }
                    } else {
                        LazyColumn {
                            items(state.carrito) { item ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(item.producto.nombre, fontWeight = FontWeight.Medium, fontFamily = InterFamily, fontSize = 14.sp, color = FerromaxDark)
                                        Text(
                                            "x${item.cantidad}  ·  $ ${"%.2f".format(item.producto.precio * item.cantidad)}",
                                            fontSize = 13.sp,
                                            fontFamily = JetBrainsMonoFamily,
                                            color = FerromaxGris
                                        )
                                    }
                                    IconButton(onClick = { viewModel.quitarDelCarrito(item.producto.id) }) {
                                        Icon(Icons.Default.Delete, contentDescription = "Quitar", tint = FerromaxError)
                                    }
                                }
                                HorizontalDivider(color = FerromaxGrisClaro)
                            }
                        }
                    }
                }
            }

            // Total y botón cobrar
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = FerromaxDark),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    val total = state.carrito.sumOf { it.producto.precio * it.cantidad }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("TOTAL", fontFamily = RajdhaniFamily, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, color = Color.White.copy(alpha = 0.7f))
                        Text("$ ${"%.2f".format(total)}", fontFamily = RajdhaniFamily, fontWeight = FontWeight.Bold, fontSize = 28.sp, color = FerromaxNaranja)
                    }
                    state.error?.let { Text(it, color = FerromaxError, fontSize = 13.sp, fontFamily = InterFamily) }
                    Button(
                        onClick = { mostrarDialogoCobro = true },
                        enabled = state.carrito.isNotEmpty() && !state.cargando,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = FerromaxNaranja)
                    ) {
                        if (state.cargando) CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                        else Text("Cobrar", fontFamily = InterFamily, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                    }
                }
            }
        }
    }

    if (mostrarDialogoCobro) {
        AlertDialog(
            onDismissRequest = { mostrarDialogoCobro = false },
            title = { Text("Medio de pago", fontFamily = RajdhaniFamily, fontWeight = FontWeight.SemiBold, fontSize = 20.sp) },
            text = {
                Column {
                    listOf("EFECTIVO" to "Efectivo", "TARJETA" to "Tarjeta", "MERCADO_PAGO" to "MercadoPago").forEach { (valor, etiqueta) ->
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                            RadioButton(
                                selected = medioPagoSeleccionado == valor,
                                onClick = { medioPagoSeleccionado = valor },
                                colors = RadioButtonDefaults.colors(selectedColor = FerromaxNaranja)
                            )
                            Text(etiqueta, fontFamily = InterFamily, fontSize = 15.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { mostrarDialogoCobro = false; viewModel.cobrar(medioPagoSeleccionado) },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = FerromaxNaranja)
                ) { Text("Confirmar", fontFamily = InterFamily, fontWeight = FontWeight.SemiBold) }
            },
            dismissButton = {
                TextButton(onClick = { mostrarDialogoCobro = false }) {
                    Text("Cancelar", fontFamily = InterFamily, color = FerromaxGris)
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }

    state.ticketVenta?.let { ticket ->
        TicketDialog(ticket = ticket, onCerrar = { viewModel.cerrarTicket() })
    }
}

@Composable
fun TicketDialog(ticket: VentaDetalleResponse, onCerrar: () -> Unit) {
    AlertDialog(
        onDismissRequest = onCerrar,
        title = {
            Text(
                "Venta #${ticket.id} — Ticket",
                fontFamily = RajdhaniFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp,
                color = FerromaxDark
            )
        },
        text = {
            Column {
                Text("Fecha: ${ticket.fecha.take(16).replace("T", " ")}", fontSize = 13.sp, fontFamily = InterFamily, color = FerromaxGris)
                Text("Medio: ${ticket.medioPago}", fontSize = 13.sp, fontFamily = InterFamily, color = FerromaxGris)
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = FerromaxGrisClaro)
                ticket.items.forEach { item ->
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.nombreProducto, fontSize = 14.sp, fontFamily = InterFamily, color = FerromaxDark)
                            Text("x${item.cantidad} × $ ${"%.2f".format(item.precioUnitario)}", fontSize = 12.sp, fontFamily = JetBrainsMonoFamily, color = FerromaxGris)
                        }
                        Text("$ ${"%.2f".format(item.subtotal)}", fontSize = 14.sp, fontFamily = RajdhaniFamily, fontWeight = FontWeight.SemiBold, color = FerromaxDark)
                    }
                }
                HorizontalDivider(color = FerromaxGrisClaro)
                Spacer(modifier = Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("TOTAL", fontFamily = RajdhaniFamily, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = FerromaxDark)
                    Text("$ ${"%.2f".format(ticket.total)}", fontFamily = RajdhaniFamily, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = FerromaxNaranja)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onCerrar,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = FerromaxNaranja)
            ) { Text("Cerrar", fontFamily = InterFamily, fontWeight = FontWeight.SemiBold) }
        },
        shape = RoundedCornerShape(20.dp)
    )
}
