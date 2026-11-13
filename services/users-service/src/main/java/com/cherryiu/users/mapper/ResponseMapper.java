package com.cherryiu.users.mapper;

import com.cherryiu.users.dto.AuthStatusResponse;
import com.cherryiu.users.dto.FriendProfileResponse;
import com.cherryiu.users.dto.UserProfileRequest;
import com.cherryiu.users.dto.UserProfileResponse;
import com.cherryiu.users.model.UserProfile;

import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.Locale;

@ApplicationScoped
public class ResponseMapper {

    public UserProfileResponse toUserResponse(UserProfile profile) {
        return new UserProfileResponse(
                profile.id.toString(),
                profile.displayName,
                profile.email,
                profile.role,
                profile.avatarUrl,
                profile.bio,
                profile.createdAt,
                profile.updatedAt
        );
    }

    public AuthStatusResponse toAuthResponse(UserProfile profile, boolean authenticated) {
        return new AuthStatusResponse(
            authenticated,
            profile.id.toString(),
            profile.email, 
            profile.displayName,
            profile.avatarUrl
        );
    }

    public FriendProfileResponse toFriendResponse(UserProfile profile) {
        return new FriendProfileResponse(
                profile.id.toString(),
                profile.displayName,
                profile.email,
                profile.avatarUrl
        );
    }

    public void applyRequest(UserProfile profile, UserProfileRequest request) {
        profile.displayName = request.displayName().trim();
        profile.email = request.email().trim().toLowerCase(Locale.ROOT);
        if (request.password() != null && !request.password().isBlank()) {
            profile.password = BcryptUtil.bcryptHash(request.password());
        }
        profile.avatarUrl = request.avatarUrl();
        profile.bio = request.bio();
        profile.updatedAt = Instant.now();
    }

    public UserProfile toNewEntity(UserProfileRequest request) {
        UserProfile profile = new UserProfile();
        profile.role = "USER";
        profile.createdAt = Instant.now();
        applyRequest(profile, request);
        return profile;
    }
}
