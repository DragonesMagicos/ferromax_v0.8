package com.ferromax.erp.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> res.sendError(401, "No autenticado"))
            )
            .authorizeHttpRequests(auth -> auth

                // Rutas públicas
                .requestMatchers(HttpMethod.POST, "/auth/login", "/auth/register").permitAll()
                .requestMatchers(HttpMethod.GET,  "/productos/publico").permitAll()
                .requestMatchers(HttpMethod.GET,  "/categorias/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/img/**").permitAll()

                // Webhook de pasarela — sin JWT (autenticación por HMAC en el controller)
                .requestMatchers(HttpMethod.POST, "/webhook/pago").permitAll()

                // Solo ADMIN — cubre todos los métodos HTTP, no solo GET
                .requestMatchers("/dashboard/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,  "/ventas").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,  "/ventas/mis-compras").hasRole("CLIENTE")
                .requestMatchers(HttpMethod.GET,  "/ventas/mis-ventas-hoy").hasRole("EMPLEADO")
                .requestMatchers(HttpMethod.PUT,  "/ventas/{id}/anular").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,  "/alertas/**").hasRole("ADMIN")

                // Clientes — solo ADMIN
                .requestMatchers("/clientes/**").hasRole("ADMIN")

                // Proveedores — lista para EMPLEADO (solo GET), gestión completa para ADMIN
                .requestMatchers(HttpMethod.GET,  "/proveedores").hasAnyRole("ADMIN", "EMPLEADO")
                .requestMatchers("/proveedores/**").hasRole("ADMIN")

                // ADMIN, EMPLEADO o CLIENTE (ventas online)
                .requestMatchers(HttpMethod.POST, "/ventas").hasAnyRole("ADMIN", "EMPLEADO", "CLIENTE")

                // Productos — rutas exclusivas EMPLEADO (sin datos sensibles)
                .requestMatchers(HttpMethod.GET,  "/productos/empleado/**").hasRole("EMPLEADO")

                // Productos — rutas ADMIN (incluyen precioCompra y proveedor)
                .requestMatchers(HttpMethod.GET,  "/productos").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,  "/productos/sku/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,  "/productos/barcode/**").hasRole("ADMIN")

                // Ajuste manual de stock — solo ADMIN
                .requestMatchers("/ajustes-stock/**").hasRole("ADMIN")

                // Recepción individual — ADMIN y EMPLEADO
                .requestMatchers(HttpMethod.POST, "/recepcion").hasAnyRole("ADMIN", "EMPLEADO")

                // Recepciones de remito — creación y consulta para EMPLEADO, confirmación solo ADMIN
                .requestMatchers(HttpMethod.POST,  "/recepciones-remito").hasAnyRole("ADMIN", "EMPLEADO")
                .requestMatchers(HttpMethod.GET,   "/recepciones-remito/mis-recepciones").hasAnyRole("ADMIN", "EMPLEADO")
                .requestMatchers(HttpMethod.GET,   "/recepciones-remito/{id}").hasAnyRole("ADMIN", "EMPLEADO")
                .requestMatchers(HttpMethod.GET,   "/recepciones-remito/pendientes").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,   "/recepciones-remito").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/recepciones-remito/{id}/confirmar").hasRole("ADMIN")

                // CLIENTE autenticado
                .requestMatchers(HttpMethod.POST, "/pedidos").hasRole("CLIENTE")
                .requestMatchers(HttpMethod.GET,  "/pedidos/mis-pedidos").hasRole("CLIENTE")

                // Cualquier otra ruta requiere autenticación
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter,
                             UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173", "http://127.0.0.1:5173",
            "http://localhost:5174", "http://127.0.0.1:5174",
            "http://localhost:5175", "http://127.0.0.1:5175"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
