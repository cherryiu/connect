package com.cherryiu.location.dto;

import java.time.Instant;

public record FriendLocationVisitResponse(
        String authUserId,
        int visitCount,
        Instant lastVisitedAt
) {
}
