package com.bluecore.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bluecore.backend.dto.CambiarEstadoDTO;
import com.bluecore.backend.dto.CrearSolicitudDTO;
import com.bluecore.backend.model.EstadoSolicitud;
import com.bluecore.backend.model.SolicitudCredito;
import com.bluecore.backend.repository.SolicitudRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/solicitudes")
@CrossOrigin(origins = "http://localhost:4200") // Permite la conexión desde el Frontend
public class SolicitudController {

    private final SolicitudRepository repository;

    public SolicitudController(SolicitudRepository repository) {
        this.repository = repository;
    }

    // 1. Crear solicitud
    @PostMapping
    public ResponseEntity<SolicitudCredito> crear(@Valid @RequestBody CrearSolicitudDTO dto) {
        SolicitudCredito solicitud = new SolicitudCredito();
        solicitud.setMonto(dto.getMonto());
        solicitud.setPlazoMeses(dto.getPlazoMeses());
        solicitud.setCedula(dto.getCedula());
        
        return new ResponseEntity<>(repository.save(solicitud), HttpStatus.CREATED);
    }

    // 2. Listar solicitudes (con filtro opcional por estado)
    @GetMapping
    public ResponseEntity<List<SolicitudCredito>> listar(@RequestParam(required = false) EstadoSolicitud estado) {
        if (estado != null) {
            return ResponseEntity.ok(repository.findByEstado(estado));
        }
        return ResponseEntity.ok(repository.findAll());
    }

    // 3. Cambiar estado
    @PatchMapping("/{id}/estado")
    public ResponseEntity<SolicitudCredito> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoDTO dto) {

        return repository.findById(id)
                .map(solicitud -> {
                    solicitud.setEstado(dto.getEstado());
                    solicitud.setComentario(dto.getComentario());
                    return ResponseEntity.ok(repository.save(solicitud));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}