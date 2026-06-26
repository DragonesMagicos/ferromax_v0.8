package com.example.beta1.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val FerromaxColorScheme = lightColorScheme(
    primary = FerromaxNaranja,
    onPrimary = FerromaxBlanco,
    primaryContainer = Color(0xFFFFE8DE),
    onPrimaryContainer = FerromaxNaranjaOscuro,
    secondary = FerromaxDark,
    onSecondary = FerromaxBlanco,
    secondaryContainer = FerromaxGrisClaro,
    onSecondaryContainer = FerromaxDark,
    background = FerromaxSurface,
    onBackground = FerromaxDark,
    surface = FerromaxBlanco,
    onSurface = FerromaxDark,
    onSurfaceVariant = FerromaxGris,
    error = FerromaxError,
    onError = FerromaxBlanco,
    outline = FerromaxGrisClaro,
)

private val FerromaxShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

@Composable
fun Beta1Theme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = FerromaxColorScheme,
        typography = Typography,
        shapes = FerromaxShapes,
        content = content
    )
}
