package com.cherryiu.users.dto;

import java.time.Instant;

public record UserProfileResponse(
        String id,
        String displayName,
        String email,
        String role,
        String avatarUrl,
        String bio,
        Instant createdAt,
        Instant updatedAt
) {
}
