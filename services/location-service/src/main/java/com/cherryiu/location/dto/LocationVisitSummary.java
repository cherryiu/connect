package com.cherryiu.location.dto;

import java.time.Instant;

public record LocationVisitSummary(
        String location,
        int visitCount,
        Instant lastVisitedAt
) {
}
