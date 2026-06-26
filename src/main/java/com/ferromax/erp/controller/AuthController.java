package com.ferromax.erp.controller;

import com.ferromax.erp.dto.LoginRequest;
import com.ferromax.erp.dto.LoginResponse;
import com.ferromax.erp.dto.RegisterRequest;
import com.ferromax.erp.dto.UsuarioDTO;
import com.ferromax.erp.exception.RecursoNoEncontradoException;
import com.ferromax.erp.model.Cliente;
import com.ferromax.erp.model.RolEnum;
import com.ferromax.erp.model.Usuario;
import com.ferromax.erp.repository.ClienteRepository;
import com.ferromax.erp.repository.UsuarioRepository;
import com.ferromax.erp.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return usuarioRepository.findByEmailAndActivoTrue(request.email())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .map(u -> ResponseEntity.ok((Object) new LoginResponse(
                        jwtTokenProvider.generarToken(u.getEmail(), u.getRol().name(), u.getId()),
                        u.getRol().name(),
                        u.getNombre(),
                        "Login exitoso")))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "UNAUTHORIZED", "mensaje", "Credenciales inválidas")));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("El email '" + request.email() + "' ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.nombre());
        usuario.setApellido(request.apellido());
        usuario.setEmail(request.email());
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(RolEnum.CLIENTE);
        usuario.setActivo(true);

        usuarioRepository.save(usuario);

        if (clienteRepository.findByEmail(request.email()).isEmpty()) {
            Cliente cliente = new Cliente();
            cliente.setNombre(request.nombre());
            cliente.setApellido(request.apellido());
            cliente.setEmail(request.email());
            clienteRepository.save(cliente);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensaje", "Usuario registrado exitosamente"));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioDTO> me(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.obtenerEmailDesdeToken(token);

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", "email", email));

        return ResponseEntity.ok(new UsuarioDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getRol().name()
        ));
    }
}
