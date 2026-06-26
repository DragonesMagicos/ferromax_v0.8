package com.example.beta1.ui.pos

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.beta1.data.local.TokenDataStore
import com.example.beta1.data.model.*
import com.example.beta1.data.remote.RetrofitClient
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class ItemCarrito(
    val producto: ProductoEmpleadoDTO,
    val cantidad: Int
)

data class PosUiState(
    val carrito: List<ItemCarrito> = emptyList(),
    val busquedaSku: String = "",
    val productoBuscado: ProductoEmpleadoDTO? = null,
    val errorBusqueda: String? = null,
    val cargando: Boolean = false,
    val ticketVenta: VentaDetalleResponse? = null,
    val error: String? = null
)

class PosViewModel(app: Application) : AndroidViewModel(app) {

    private val dataStore = TokenDataStore(app)
    private val _state = MutableStateFlow(PosUiState())
    val state: StateFlow<PosUiState> = _state

    val nombre: Flow<String?> = dataStore.nombre
    private val token: Flow<String?> = dataStore.token

    private suspend fun bearerToken(): String = "Bearer ${token.first() ?: ""}"

    fun buscarPorSku(sku: String) {
        if (sku.isBlank()) return
        viewModelScope.launch {
            _state.update { it.copy(errorBusqueda = null, productoBuscado = null) }
            try {
                val producto = RetrofitClient.api.buscarPorSku(bearerToken(), sku.trim().uppercase())
                _state.update { it.copy(productoBuscado = producto, busquedaSku = sku) }
            } catch (e: Exception) {
                _state.update { it.copy(errorBusqueda = "Producto no encontrado") }
            }
        }
    }

    fun agregarAlCarrito(producto: ProductoEmpleadoDTO) {
        _state.update { s ->
            val existente = s.carrito.indexOfFirst { it.producto.id == producto.id }
            val nuevoCarrito = if (existente >= 0) {
                s.carrito.toMutableList().also {
                    it[existente] = it[existente].copy(cantidad = it[existente].cantidad + 1)
                }
            } else {
                s.carrito + ItemCarrito(producto, 1)
            }
            s.copy(carrito = nuevoCarrito, productoBuscado = null, busquedaSku = "")
        }
    }

    fun quitarDelCarrito(productoId: Long) {
        _state.update { it.copy(carrito = it.carrito.filter { i -> i.producto.id != productoId }) }
    }

    fun cobrar(medioPago: String) {
        val carrito = _state.value.carrito
        if (carrito.isEmpty()) return
        viewModelScope.launch {
            _state.update { it.copy(cargando = true, error = null) }
            try {
                val request = VentaRequest(
                    items = carrito.map { ItemVentaRequest(it.producto.id, it.cantidad) },
                    medioPago = medioPago
                )
                val ticket = RetrofitClient.api.registrarVenta(bearerToken(), request)
                _state.update { it.copy(cargando = false, ticketVenta = ticket, carrito = emptyList()) }
            } catch (e: Exception) {
                _state.update { it.copy(cargando = false, error = "Error al registrar la venta") }
            }
        }
    }

    fun cerrarTicket() {
        _state.update { it.copy(ticketVenta = null) }
    }

    fun cerrarSesion(onDone: () -> Unit) {
        viewModelScope.launch {
            dataStore.limpiar()
            onDone()
        }
    }
}
