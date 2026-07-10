package com.cherryiu.users.businesslogic;

import com.cherryiu.users.dto.UserProfileRequest;
import com.cherryiu.users.dto.UserProfileResponse;
import com.cherryiu.users.exception.UserNotFoundException;
import com.cherryiu.users.mapper.ResponseMapper;
import com.cherryiu.users.model.UserProfile;
import com.cherryiu.users.repository.UserProfileRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
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

    public void deleteProfile(String userId) {
        UserProfile profile = findProfileOrThrow(userId);
        userProfileRepository.delete(profile);
    }

    private UserProfile findProfileOrThrow(String userId) {
        return userProfileRepository.findByIdOptional(new ObjectId(userId))
                .orElseThrow(() -> new UserNotFoundException(userId));
    }
}
