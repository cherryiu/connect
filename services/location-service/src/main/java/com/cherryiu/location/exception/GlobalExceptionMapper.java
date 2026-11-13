package com.cherryiu.location.exception;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.time.Instant;
import java.util.Map;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<RuntimeException> {

    @Override
    public Response toResponse(RuntimeException exception) {

        if (exception instanceof IllegalArgumentException
                || exception instanceof BadRequestException
                || exception instanceof ConstraintViolationException) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(error("BAD_REQUEST", exception.getMessage()))
                    .build();
        }

        if (exception instanceof WebApplicationException webException) {
            return Response.status(webException.getResponse().getStatus())
                    .entity(error("REQUEST_FAILED", exception.getMessage()))
                    .build();
        }

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(error("INTERNAL_SERVER_ERROR", "Unexpected server error."))
                .build();
    }

    private Map<String, Object> error(String code, String message) {
        return Map.of(
                "timestamp", Instant.now().toString(),
                "code", code,
                "message", message
        );
    }
}
