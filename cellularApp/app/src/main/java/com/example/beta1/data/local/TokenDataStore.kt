package com.example.beta1.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "ferromax_prefs")

class TokenDataStore(private val context: Context) {

    companion object {
        private val KEY_TOKEN = stringPreferencesKey("jwt_token")
        private val KEY_NOMBRE = stringPreferencesKey("nombre")
        private val KEY_ROL = stringPreferencesKey("rol")
    }

    val token: Flow<String?> = context.dataStore.data.map { it[KEY_TOKEN] }
    val nombre: Flow<String?> = context.dataStore.data.map { it[KEY_NOMBRE] }

    suspend fun guardar(token: String, nombre: String, rol: String) {
        context.dataStore.edit {
            it[KEY_TOKEN] = token
            it[KEY_NOMBRE] = nombre
            it[KEY_ROL] = rol
        }
    }

    suspend fun limpiar() {
        context.dataStore.edit { it.clear() }
    }
}
