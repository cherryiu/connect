package com.cherryiu.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Profile fields that may be changed without requiring a password reset. */
public record UpdateUserProfileRequest(
        @NotBlank @Size(max = 80) String displayName,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(min = 6, max = 72) String password,
        @Pattern(regexp = "USER") String role,
        @Size(max = 4_000_000)
        @Pattern(
                regexp = "^(https?://[^\\s]+|data:image/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+)$",
                message = "must be an HTTP URL or a supported uploaded image"
        )
        String avatarUrl,
        @Size(max = 500) String bio
) {
}
