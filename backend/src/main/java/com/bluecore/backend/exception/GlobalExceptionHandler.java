package com.bluecore.backend.exception;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Traduce las excepciones de la capa web a un cuerpo JSON estable para el frontend.
 *
 * Por defecto Spring Boot descarta los mensajes declarados en los DTO y responde solo
 * {"status":400,"error":"Bad Request"}, lo que obliga al cliente a inventar textos
 * genéricos. Aquí se exponen tal cual, y por campo, para poder señalar el input concreto.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Fallo de @Valid sobre un @RequestBody: un mensaje por campo. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> manejarValidacion(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errores.putIfAbsent(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> cuerpo = cuerpoBase(HttpStatus.BAD_REQUEST,
                "La solicitud contiene datos inválidos");
        cuerpo.put("errors", errores);
        return ResponseEntity.badRequest().body(cuerpo);
    }

    /** Parámetro de query con un valor fuera del enum, p. ej. ?estado=OTRO. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> manejarTipoInvalido(MethodArgumentTypeMismatchException ex) {
        String mensaje = "El valor '%s' no es válido para el parámetro '%s'"
                .formatted(ex.getValue(), ex.getName());
        return ResponseEntity.badRequest().body(cuerpoBase(HttpStatus.BAD_REQUEST, mensaje));
    }

    /** JSON malformado o un enum desconocido dentro del cuerpo. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> manejarCuerpoIlegible(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(cuerpoBase(HttpStatus.BAD_REQUEST,
                "El cuerpo de la petición no tiene un formato válido"));
    }

    private Map<String, Object> cuerpoBase(HttpStatus estado, String mensaje) {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("timestamp", Instant.now().toString());
        cuerpo.put("status", estado.value());
        cuerpo.put("message", mensaje);
        return cuerpo;
    }
}
