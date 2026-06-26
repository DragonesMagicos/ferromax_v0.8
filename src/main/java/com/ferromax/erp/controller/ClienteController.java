package com.ferromax.erp.controller;

import com.ferromax.erp.exception.RecursoNoEncontradoException;
import com.ferromax.erp.model.Cliente;
import com.ferromax.erp.repository.ClienteRepository;
import com.ferromax.erp.repository.PedidoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/clientes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ClienteController {

    private final ClienteRepository clienteRepository;
    private final PedidoRepository pedidoRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        Map<Long, BigDecimal> totales = pedidoRepository.sumTotalPorCliente().stream()
            .collect(Collectors.toMap(
                r -> ((Number) r.get("clienteId")).longValue(),
                r -> (BigDecimal) r.get("totalCompras")
            ));

        List<Map<String, Object>> resultado = clienteRepository.findAll().stream()
            .map(c -> {
                Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id",           c.getId());
                m.put("nombre",       c.getNombre());
                m.put("apellido",     c.getApellido());
                m.put("email",        c.getEmail());
                m.put("cuit",         c.getCuit());
                m.put("telefono",     c.getTelefono());
                m.put("condicionIva", c.getCondicionIva());
                m.put("totalCompras", totales.getOrDefault(c.getId(), BigDecimal.ZERO));
                return m;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> obtener(@PathVariable Long id) {
        Cliente c = clienteRepository.findById(id)
            .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado: " + id));
        return ResponseEntity.ok(c);
    }

    @PostMapping
    public ResponseEntity<Cliente> crear(@Valid @RequestBody Cliente cliente) {
        cliente.setId(null);
        return ResponseEntity.ok(clienteRepository.save(cliente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> actualizar(@PathVariable Long id,
                                              @Valid @RequestBody Cliente datos) {
        Cliente c = clienteRepository.findById(id)
            .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado: " + id));
        c.setNombre(datos.getNombre());
        c.setApellido(datos.getApellido());
        c.setEmail(datos.getEmail());
        c.setCuit(datos.getCuit());
        c.setTelefono(datos.getTelefono());
        c.setCondicionIva(datos.getCondicionIva());
        return ResponseEntity.ok(clienteRepository.save(c));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!clienteRepository.existsById(id))
            throw new RecursoNoEncontradoException("Cliente no encontrado: " + id);
        clienteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
