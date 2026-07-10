package com.cherryiu.users.dto;

public record UserProfileRequest(
        String displayName,
        String email,
        String password,
        String role,
        String avatarUrl,
        String bio
) {
}
