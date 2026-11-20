package com.cherryiu.location.dto;

import jakarta.validation.constraints.NotNull;

public record AttendanceConfirmationRequest(
        @NotNull Boolean attended
) {
}
