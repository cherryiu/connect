package com.cherryiu.hangouts.dto;

import java.time.Instant;
import java.util.List;

public record HangoutModelRequest(
        List<String> participantAuthUserIds,
        String hangoutName,
        String location,
        Instant startTime,
        Instant endTime,
        String description,
        Boolean isOpen
) {
}
