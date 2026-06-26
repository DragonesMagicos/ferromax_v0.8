package com.example.beta1.data.remote

import android.util.Log
import com.example.beta1.BuildConfig
import com.example.beta1.ui.recepcion.ItemFacturaParseado
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.generationConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray

object FacturaParser {

    private val model by lazy {
        GenerativeModel(
            modelName = "gemini-2.0-flash",
            apiKey = BuildConfig.GEMINI_API_KEY,
            generationConfig = generationConfig {
                temperature = 0f
            }
        )
    }

    private val PROMPT = """
Sos un asistente de ferretería argentina. Te doy el texto crudo extraído por OCR de una factura o remito de proveedor.

PASO 1 — Encontrá la fila de encabezado de la tabla de productos.
Esa fila contiene AL MENOS 2 de estas palabras en la MISMA línea: "cod", "codigo", "art", "articulo", "descripcion", "descr", "cantidad", "cant", "precio", "unit", "importe", "total".
Una sola palabra no alcanza para identificar el encabezado.

PASO 2 — Todo lo que está DEBAJO del encabezado son los ítems. Ignorá todo lo de arriba (proveedor, fecha, CUIT, dirección, condición de pago).

PASO 3 — De cada ítem extraé:
- "sku": código del producto (columna cod/codigo/art). Alfanumérico, puede tener guiones.
- "cantidad": unidades recibidas (columna cantidad/cant). Si no está claro, usá 1.
Ignorá descripción, precio unitario, subtotal, IVA, total.

PASO 4 — Detené la extracción en líneas de totales, subtotales, IVA o pie de página.

Devolvé ÚNICAMENTE un array JSON:
[{"sku":"CODIGO","cantidad":N},...]

Si no hay ítems o no encontrás el encabezado, devolvé: []

Texto OCR:
---
%TEXT%
---

Respuesta (solo el JSON):
""".trimIndent()

    suspend fun parsear(textoOcr: String): List<ItemFacturaParseado> = withContext(Dispatchers.IO) {
        if (textoOcr.isBlank()) return@withContext emptyList()

        try {
            val prompt = PROMPT.replace("%TEXT%", textoOcr.take(3000))
            val response = model.generateContent(prompt)
            val json = response.text?.trim() ?: return@withContext emptyList()

            val jsonLimpio = json
                .removePrefix("```json").removePrefix("```")
                .removeSuffix("```")
                .trim()

            val array = JSONArray(jsonLimpio)
            val items = mutableListOf<ItemFacturaParseado>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val sku = obj.optString("sku").trim().uppercase()
                val cantidad = obj.optInt("cantidad", 1).coerceIn(1, 9999)
                if (sku.isNotBlank()) {
                    items.add(ItemFacturaParseado(sku, cantidad, "$sku × $cantidad"))
                }
            }
            items
        } catch (e: Exception) {
            Log.e("FacturaParser", "Error procesando factura", e)
            emptyList()
        }
    }
}