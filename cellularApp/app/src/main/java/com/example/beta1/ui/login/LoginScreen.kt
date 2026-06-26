package com.example.beta1.ui.login

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.beta1.ui.theme.FerromaxDark
import com.example.beta1.ui.theme.FerromaxNaranja
import com.example.beta1.ui.theme.FerromaxSurface
import com.example.beta1.ui.theme.RajdhaniFamily
import com.example.beta1.ui.theme.InterFamily

@Composable
fun LoginScreen(onLoginExitoso: () -> Unit) {
    val viewModel: LoginViewModel = viewModel()
    val state by viewModel.state.collectAsState()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    LaunchedEffect(state) {
        if (state is LoginUiState.Success) onLoginExitoso()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(FerromaxDark, Color(0xFF16213E))
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(FerromaxNaranja),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "F",
                    fontSize = 36.sp,
                    fontFamily = RajdhaniFamily,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "FERRO​MAX",
                fontSize = 34.sp,
                fontFamily = RajdhaniFamily,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                letterSpacing = 2.sp
            )
            Text(
                text = "Sistema de Gestión",
                fontSize = 13.sp,
                fontFamily = InterFamily,
                color = Color.White.copy(alpha = 0.5f)
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Card formulario
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(
                    modifier = Modifier.padding(28.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Iniciar sesión",
                        fontSize = 20.sp,
                        fontFamily = RajdhaniFamily,
                        fontWeight = FontWeight.SemiBold,
                        color = FerromaxDark
                    )

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email", fontFamily = InterFamily, fontSize = 13.sp) },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = FerromaxNaranja) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = FerromaxNaranja,
                            focusedLabelColor = FerromaxNaranja,
                            cursorColor = FerromaxNaranja,
                            unfocusedContainerColor = FerromaxSurface,
                            focusedContainerColor = FerromaxSurface
                        )
                    )

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Contraseña", fontFamily = InterFamily, fontSize = 13.sp) },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = FerromaxNaranja) },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = FerromaxNaranja,
                            focusedLabelColor = FerromaxNaranja,
                            cursorColor = FerromaxNaranja,
                            unfocusedContainerColor = FerromaxSurface,
                            focusedContainerColor = FerromaxSurface
                        )
                    )

                    if (state is LoginUiState.Error) {
                        Text(
                            text = (state as LoginUiState.Error).mensaje,
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 13.sp,
                            fontFamily = InterFamily
                        )
                    }

                    Button(
                        onClick = { viewModel.login(email, password) },
                        enabled = state !is LoginUiState.Loading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = FerromaxNaranja)
                    ) {
                        if (state is LoginUiState.Loading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = Color.White
                            )
                        } else {
                            Text(
                                "Ingresar",
                                fontFamily = InterFamily,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 16.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "Herramientas para quienes construyen",
                fontSize = 11.sp,
                fontFamily = InterFamily,
                color = Color.White.copy(alpha = 0.3f)
            )
        }
    }
}
