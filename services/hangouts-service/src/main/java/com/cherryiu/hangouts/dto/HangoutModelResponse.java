package com.cherryiu.hangouts.dto;

import java.time.Instant;
import java.util.List;

public record HangoutModelResponse(
        String id,
        String authHangoutId,
        List<String> participantAuthUserIds,
        List<String> invitedAuthUserIds,
        String hangoutName,
        String location,
        Instant startTime,
        Instant endTime,
        String description,
        Boolean isOpen,
        Instant createdAt,
        Instant updatedAt
) {
}
