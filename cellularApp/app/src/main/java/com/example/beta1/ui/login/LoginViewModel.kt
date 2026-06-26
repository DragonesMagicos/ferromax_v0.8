package com.example.beta1.ui.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.beta1.data.local.TokenDataStore
import com.example.beta1.data.model.LoginRequest
import com.example.beta1.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    object Success : LoginUiState()
    data class Error(val mensaje: String) : LoginUiState()
}

class LoginViewModel(app: Application) : AndroidViewModel(app) {

    private val dataStore = TokenDataStore(app)
    private val _state = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val state: StateFlow<LoginUiState> = _state

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _state.value = LoginUiState.Error("Completá usuario y contraseña")
            return
        }
        viewModelScope.launch {
            _state.value = LoginUiState.Loading
            try {
                val response = RetrofitClient.api.login(LoginRequest(email.trim(), password))
                dataStore.guardar(response.token, response.nombre, response.rol)
                _state.value = LoginUiState.Success
            } catch (e: Exception) {
                _state.value = LoginUiState.Error("Credenciales incorrectas")
            }
        }
    }
}
