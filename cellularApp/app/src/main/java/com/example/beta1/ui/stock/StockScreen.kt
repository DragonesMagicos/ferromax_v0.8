package com.example.beta1.ui.stock

import android.app.Application
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.beta1.data.local.TokenDataStore
import com.example.beta1.data.model.ProductoEmpleadoDTO
import com.example.beta1.data.remote.RetrofitClient
import com.example.beta1.ui.theme.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class StockViewModel(app: Application) : AndroidViewModel(app) {
    private val dataStore = TokenDataStore(app)
    private val _productos = MutableStateFlow<List<ProductoEmpleadoDTO>>(emptyList())
    val productos: StateFlow<List<ProductoEmpleadoDTO>> = _productos
    private val _cargando = MutableStateFlow(false)
    val cargando: StateFlow<Boolean> = _cargando
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error
    var filtro by androidx.compose.runtime.mutableStateOf("")

    init { cargar() }

    private fun cargar() {
        viewModelScope.launch {
            _cargando.value = true
            try {
                val token = "Bearer ${dataStore.token.first() ?: ""}"
                _productos.value = RetrofitClient.api.listarProductos(token)
            } catch (e: Exception) {
                _error.value = "Error al cargar productos"
            } finally {
                _cargando.value = false
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StockScreen(onVolver: () -> Unit) {
    val viewModel: StockViewModel = viewModel()
    val productos by viewModel.productos.collectAsState()
    val cargando by viewModel.cargando.collectAsState()
    val error by viewModel.error.collectAsState()

    val filtrados = productos.filter {
        it.nombre.contains(viewModel.filtro, ignoreCase = true) ||
        it.sku.contains(viewModel.filtro, ignoreCase = true)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Consulta de Stock",
                        fontFamily = RajdhaniFamily,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 20.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onVolver) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = FerromaxDark,
                    titleContentColor = Color.White
                )
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
            OutlinedTextField(
                value = viewModel.filtro,
                onValueChange = { viewModel.filtro = it },
                label = { Text("Buscar producto o SKU", fontFamily = InterFamily, fontSize = 13.sp) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = FerromaxNaranja,
                    focusedLabelColor = FerromaxNaranja,
                    cursorColor = FerromaxNaranja,
                    unfocusedContainerColor = Color.White,
                    focusedContainerColor = Color.White
                )
            )

            when {
                cargando -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = FerromaxNaranja)
                }
                error != null -> Text(error!!, color = FerromaxError, fontFamily = InterFamily)
                else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(filtrados) { producto ->
                        val stockBajo = producto.stockActual <= producto.stockMinimo
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
                                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Text(producto.nombre, fontWeight = FontWeight.SemiBold, fontFamily = InterFamily, fontSize = 15.sp, color = FerromaxDark)
                                    Text(
                                        "SKU: ${producto.sku}",
                                        fontSize = 12.sp,
                                        fontFamily = JetBrainsMonoFamily,
                                        color = FerromaxGris
                                    )
                                    Text(
                                        "$ ${"%.2f".format(producto.precio)}",
                                        fontSize = 15.sp,
                                        fontFamily = RajdhaniFamily,
                                        fontWeight = FontWeight.SemiBold,
                                        color = FerromaxNaranja
                                    )
                                }
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "${producto.stockActual}",
                                        fontSize = 26.sp,
                                        fontFamily = RajdhaniFamily,
                                        fontWeight = FontWeight.Bold,
                                        color = if (stockBajo) FerromaxError else FerromaxExito
                                    )
                                    Text(
                                        "uds.",
                                        fontSize = 11.sp,
                                        fontFamily = InterFamily,
                                        color = FerromaxGris
                                    )
                                    if (stockBajo) {
                                        Text(
                                            "BAJO",
                                            fontSize = 10.sp,
                                            fontFamily = InterFamily,
                                            fontWeight = FontWeight.Bold,
                                            color = FerromaxError
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
