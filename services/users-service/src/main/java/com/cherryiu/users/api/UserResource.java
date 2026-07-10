package com.cherryiu.users.api;

import com.cherryiu.users.businesslogic.UserBusinessLogic;
import com.cherryiu.users.dto.UserProfileRequest;
import com.cherryiu.users.dto.UserProfileResponse;
import io.quarkus.security.UnauthorizedException;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/users")
@Tag(name = "User Profile")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    UserBusinessLogic userBusinessLogic;

    @Inject
    SecurityIdentity identity;

    @GET
    @Path("/ping")
    @Produces(MediaType.TEXT_PLAIN)
    public String ping() {
        return "user-profile-service is running";
    }

    @GET
    @Path("/me")
    @Operation(summary = "Get the current user profile")
    public UserProfileResponse getProfile() {
        return userBusinessLogic.getProfile(currentUserId());
    }

    @POST
    @PermitAll
    @Path("/register")
    @Operation(summary = "Create a user profile")
    public Response createProfile(UserProfileRequest request) {
        UserProfileResponse response = userBusinessLogic.createProfile(request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @PUT
    @Path("/me")
    @Operation(summary = "Update the current user profile")
    public UserProfileResponse updateProfile(UserProfileRequest request) {
        return userBusinessLogic.updateProfile(currentUserId(), request);
    }

    @DELETE
    @Path("/me")
    @Operation(summary = "Delete the current user profile")
    public Response deleteProfile() {
        userBusinessLogic.deleteProfile(currentUserId());
        return Response.noContent().build();
    }

    private String currentUserId() {
        if (identity.isAnonymous()) {
            throw new UnauthorizedException("Not authenticated");
        }
        String userId = identity.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("Authenticated session is missing user id");
        }
        return userId;
    }
}
