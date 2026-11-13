package com.cherryiu.users.dto;

// backend DTO returned by /auth/status
public record AuthStatusResponse(
  boolean authenticated,
  String authUserId,
  String email,
  String displayName,
  String avatarUrl
) {

  public static AuthStatusResponse anonymous() {
        return new AuthStatusResponse(false, null, null, null, null);
    }
}
