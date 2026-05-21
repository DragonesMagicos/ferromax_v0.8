package com.ferromax.erp.controller;

import com.ferromax.erp.dto.RegisterRequest;
import com.ferromax.erp.model.RolEnum;
import com.ferromax.erp.model.Usuario;
import com.ferromax.erp.repository.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/crear-empleado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> crearEmpleado(
            @Valid @RequestBody RegisterRequest request,
            @RequestParam(defaultValue = "EMPLEADO") String rol) {

        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El email ya está registrado"));
        }

        RolEnum rolAsignado = switch (rol.toUpperCase()) {
            case "ADMIN"    -> RolEnum.ADMIN;
            case "EMPLEADO" -> RolEnum.EMPLEADO;
            default         -> RolEnum.EMPLEADO;
        };

        Usuario usuario = new Usuario();
        usuario.setNombre(request.nombre());
        usuario.setApellido(request.apellido());
        usuario.setEmail(request.email());
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(rolAsignado);
        usuario.setActivo(true);

        usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensaje", "Usuario " + rolAsignado.name() + " creado exitosamente"));
    }
}
