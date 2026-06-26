

package com.example.beta1

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.beta1.ui.NavGraph
import com.example.beta1.ui.theme.Beta1Theme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Beta1Theme {
                NavGraph()
            }
        }
    }
}
