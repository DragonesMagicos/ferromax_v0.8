package com.example.beta1.data.remote

import com.example.beta1.data.model.*
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @GET("productos/empleado")
    suspend fun listarProductos(@Header("Authorization") token: String): List<ProductoEmpleadoDTO>

    @GET("productos/empleado/sku/{sku}")
    suspend fun buscarPorSku(
        @Header("Authorization") token: String,
        @Path("sku") sku: String
    ): ProductoEmpleadoDTO

    @POST("ventas")
    suspend fun registrarVenta(
        @Header("Authorization") token: String,
        @Body request: VentaRequest
    ): VentaDetalleResponse

    @POST("recepcion")
    suspend fun registrarRecepcion(
        @Header("Authorization") token: String,
        @Body request: RecepcionRequest
    ): RecepcionResponse

    @GET("proveedores")
    suspend fun listarProveedores(@Header("Authorization") token: String): List<ProveedorDTO>

    // ── Producto rápido desde recepción ──────────────────────────────────────

    @POST("productos/empleado/rapido")
    suspend fun crearProductoRapido(
        @Header("Authorization") token: String,
        @Body request: ProductoRapidoRequest
    ): ProductoEmpleadoDTO

    @GET("productos/empleado/imagenes")
    suspend fun buscarImagenes(
        @Header("Authorization") token: String,
        @Query("q") query: String
    ): List<String>

    @GET("productos/empleado/barcode/{codigo}")
    suspend fun buscarPorBarcode(
        @Header("Authorization") token: String,
        @Path("codigo") codigo: String
    ): ProductoEmpleadoDTO

    // ── Recepciones de remito ─────────────────────────────────────────────────

    @POST("recepciones-remito")
    suspend fun crearRemito(
        @Header("Authorization") token: String,
        @Body request: RecepcionRemitoRequest
    ): RecepcionRemitoResponse

    @GET("recepciones-remito/mis-recepciones")
    suspend fun misRecepciones(@Header("Authorization") token: String): List<RecepcionRemitoResponse>
}
