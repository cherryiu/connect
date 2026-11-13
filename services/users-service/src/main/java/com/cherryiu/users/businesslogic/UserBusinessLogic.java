package com.cherryiu.users.businesslogic;

import com.cherryiu.users.dto.FriendProfileResponse;
import com.cherryiu.users.dto.UserProfileRequest;
import com.cherryiu.users.dto.UserProfileResponse;
import com.cherryiu.users.exception.UserNotFoundException;
import com.cherryiu.users.mapper.ResponseMapper;
import com.cherryiu.users.model.UserProfile;
import com.cherryiu.users.repository.UserProfileRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.core.Response;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;

@ApplicationScoped
public class UserBusinessLogic {

    @Inject
    UserProfileRepository userProfileRepository;

    @Inject
    ResponseMapper responseMapper;

    public UserProfileResponse getProfile(String userId) {
        UserProfile profile = findProfileOrThrow(userId);
        return responseMapper.toUserResponse(profile);
    }

    public UserProfileResponse createProfile(UserProfileRequest request) {
        if (userProfileRepository.findByEmail(request.email()).isPresent()) {
            throw new ClientErrorException("Email is already registered", Response.Status.CONFLICT);
        }
        UserProfile profile = responseMapper.toNewEntity(request);
        userProfileRepository.persist(profile);
        return responseMapper.toUserResponse(profile);
    }

    public UserProfileResponse updateProfile(String userId, UserProfileRequest request) {
        UserProfile profile = findProfileOrThrow(userId);
        responseMapper.applyRequest(profile, request);
        userProfileRepository.update(profile);
        return responseMapper.toUserResponse(profile);
    }

    public List<FriendProfileResponse> getFriends(String userId) {
        UserProfile profile = findProfileOrThrow(userId);
        if (profile.friendIds == null || profile.friendIds.isEmpty()) {
            return List.of();
        }

        return profile.friendIds.stream()
                .map(userProfileRepository::findByIdOptional)
                .flatMap(Optional::stream)
                .map(responseMapper::toFriendResponse)
                .sorted(Comparator.comparing(
                        FriendProfileResponse::displayName,
                        String.CASE_INSENSITIVE_ORDER
                ))
                .toList();
    }

    public void addFriend(String userId, String friendId) {
        UserProfile profile = findProfileOrThrow(userId);
        ObjectId friendObjectId = parseObjectId(friendId);
        if (profile.id.equals(friendObjectId)) {
            throw new BadRequestException("A user cannot add themselves as a friend");
        }

        // Confirm the referenced user exists before storing the relationship.
        findProfileOrThrow(friendId);
        if (profile.friendIds == null) {
            profile.friendIds = new ArrayList<>();
        }
        if (profile.friendIds.contains(friendObjectId)) {
            return;
        }

        profile.friendIds.add(friendObjectId);
        profile.updatedAt = Instant.now();
        userProfileRepository.update(profile);
    }

    public void deleteProfile(String userId) {
        UserProfile profile = findProfileOrThrow(userId);
        userProfileRepository.delete(profile);
    }

    private UserProfile findProfileOrThrow(String userId) {
        return userProfileRepository.findByIdOptional(parseObjectId(userId))
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private ObjectId parseObjectId(String id) {
        if (!ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid user id");
        }
        return new ObjectId(id);
    }
}
