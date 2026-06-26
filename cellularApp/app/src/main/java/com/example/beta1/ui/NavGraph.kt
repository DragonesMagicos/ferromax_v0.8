package com.example.beta1.ui

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.beta1.ui.login.LoginScreen
import com.example.beta1.ui.pos.PosScreen
import com.example.beta1.ui.recepcion.RecepcionScreen
import com.example.beta1.ui.stock.StockScreen

object Rutas {
    const val LOGIN = "login"
    const val POS = "pos"
    const val STOCK = "stock"
    const val RECEPCION = "recepcion"
}

@Composable
fun NavGraph() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Rutas.LOGIN) {
        composable(Rutas.LOGIN) {
            LoginScreen(onLoginExitoso = {
                navController.navigate(Rutas.POS) {
                    popUpTo(Rutas.LOGIN) { inclusive = true }
                }
            })
        }
        composable(Rutas.POS) {
            PosScreen(
                onVerStock = { navController.navigate(Rutas.STOCK) },
                onVerRecepcion = { navController.navigate(Rutas.RECEPCION) },
                onCerrarSesion = {
                    navController.navigate(Rutas.LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        composable(Rutas.STOCK) {
            StockScreen(onVolver = { navController.popBackStack() })
        }
        composable(Rutas.RECEPCION) {
            RecepcionScreen(onVolver = { navController.popBackStack() })
        }
    }
}
