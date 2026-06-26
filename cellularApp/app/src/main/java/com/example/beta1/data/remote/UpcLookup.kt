package com.example.beta1.data.remote

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.URL

data class ProductoEncontrado(
    val nombre: String,
    val descripcion: String?,
    val marca: String?
)

object UpcLookup {

    suspend fun buscar(codigoBarras: String): ProductoEncontrado? = withContext(Dispatchers.IO) {
        try {
            val url = "https://api.upcitemdb.com/prod/trial/lookup?upc=$codigoBarras"
            val respuesta = URL(url).readText()
            val json = JSONObject(respuesta)
            val items = json.optJSONArray("items") ?: return@withContext null
            if (items.length() == 0) return@withContext null

            val item = items.getJSONObject(0)
            val nombre = item.optString("title").ifBlank { return@withContext null }
            val descripcion = item.optString("description").ifBlank { null }
            val marca = item.optString("brand").ifBlank { null }

            ProductoEncontrado(nombre, descripcion, marca)
        } catch (e: Exception) {
            Log.e("UpcLookup", "Error buscando código $codigoBarras", e)
            null
        }
    }
}