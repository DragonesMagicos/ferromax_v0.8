package com.example.beta1.data.model

data class LoginRequest(val email: String, val password: String)

data class LoginResponse(
    val token: String,
    val nombre: String,
    val rol: String
)

data class ProductoEmpleadoDTO(
    val id: Long,
    val sku: String,
    val nombre: String,
    val descripcion: String?,
    val precio: Double,
    val stockActual: Int,
    val stockMinimo: Int,
    val categoria: String?,
    val imagenUrl: String?
)

data class ItemVentaRequest(
    val productoId: Long,
    val cantidad: Int
)

data class VentaRequest(
    val items: List<ItemVentaRequest>,
    val medioPago: String,
    val clienteId: Long? = null
)

data class ItemVentaResponse(
    val productoId: Long,
    val nombreProducto: String,
    val sku: String,
    val cantidad: Int,
    val precioUnitario: Double,
    val subtotal: Double
)

data class VentaDetalleResponse(
    val id: Long,
    val fecha: String,
    val total: Double,
    val medioPago: String,
    val items: List<ItemVentaResponse>
)

data class RecepcionRequest(
    val productoId: Long,
    val cantidad: Int,
    val notas: String? = null,
    val recepcionRemitoId: Long? = null
)

data class RecepcionResponse(
    val productoId: Long,
    val nombreProducto: String,
    val stockAnterior: Int,
    val stockNuevo: Int
)

data class ProveedorDTO(
    val id: Long,
    val nombre: String
)

data class RecepcionRemitoRequest(
    val proveedorId: Long,
    val numeroRemito: String,
    val notas: String? = null
)

data class RecepcionRemitoResponse(
    val id: Long,
    val proveedorId: Long,
    val nombreProveedor: String,
    val numeroRemito: String,
    val estado: String,
    val nombreEmpleado: String,
    val createdAt: String
)

data class ProductoRapidoRequest(
    val codigoBarras: String,
    val sku: String? = null,
    val nombre: String,
    val descripcion: String? = null,
    val imagenUrl: String? = null
)

data class ItemRemitoLocal(
    val productoId: Long,
    val sku: String,
    val nombreProducto: String,
    val cantidad: Int,
    val stockAnterior: Int,
    val stockNuevo: Int
)

data class RemitoLocal(
    val remitoId: Long,
    val proveedorId: Long,
    val nombreProveedor: String,
    val numeroRemito: String,
    val items: List<ItemRemitoLocal>
)
