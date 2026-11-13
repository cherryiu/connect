package com.cherryiu.hangouts.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record HangoutModelRequest(
        @NotEmpty List<@Pattern(regexp = "^[0-9a-fA-F]{24}$") String> participantAuthUserIds,
        List<@Pattern(regexp = "^[0-9a-fA-F]{24}$") String> invitedAuthUserIds,
        @NotBlank @Size(max = 120) String hangoutName,
        @Size(max = 200) String location,
        @NotNull Instant startTime,
        @NotNull Instant endTime,
        @Size(max = 1000) String description,
        @NotNull Boolean isOpen
) {
}
