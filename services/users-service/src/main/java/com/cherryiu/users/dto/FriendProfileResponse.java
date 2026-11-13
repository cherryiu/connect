package com.cherryiu.users.dto;

/**
 * The small, public representation of a user returned in a friends list.
 * Password hashes and internal persistence details must never leave the service.
 */
public record FriendProfileResponse(
        String authUserId,
        String displayName,
        String email,
        String avatarUrl
) {
}
