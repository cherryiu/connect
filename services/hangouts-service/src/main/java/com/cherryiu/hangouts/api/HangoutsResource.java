package com.cherryiu.hangouts.api;

import com.cherryiu.hangouts.businesslogic.HangoutsBusinessLogic;
import com.cherryiu.hangouts.dto.HangoutModelRequest;
import com.cherryiu.hangouts.dto.HangoutModelResponse;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/hangouts")
@Tag(name = "Hangouts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class HangoutsResource {

    @Inject
    HangoutsBusinessLogic hangoutBusinessLogic;

    @GET
    @Path("/ping")
    @Produces(MediaType.TEXT_PLAIN)
    public String ping() {
        return "hangouts-service is running";
    }

    @GET
    @Path("/{authHangoutId}/retrieve")
    @Operation(summary = "Retrieve a hangout instance")
    public HangoutModelResponse getHangout(@PathParam("authHangoutId") String authHangoutId) {
        return hangoutBusinessLogic.getHangout(authHangoutId);
    }

    @GET
    @Path("/user/{authUserId}")
    @Operation(summary = "Retrieve hangouts for a participant")
    public List<HangoutModelResponse> getHangoutsForUser(
            @PathParam("authUserId") String authUserId
    ) {
        return hangoutBusinessLogic.getHangoutsForUser(authUserId);
    }

    @POST
    @Path("/{authHangoutId}/create")
    @Operation(summary = "Create a hangout")
    public Response createHangout(
            @PathParam("authHangoutId") String authHangoutId,
            @Valid HangoutModelRequest request
    ) {
        HangoutModelResponse response = hangoutBusinessLogic.createHangout(authHangoutId, request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @PUT
    @Path("/{authHangoutId}/update")
    @Operation(summary = "Update a hangout")
    public HangoutModelResponse updateHangout(
            @PathParam("authHangoutId") String authHangoutId,
            @Valid HangoutModelRequest request
    ) {
        return hangoutBusinessLogic.updateHangout(authHangoutId, request);
    }

    @DELETE
    @Path("/{authHangoutId}/delete")
    @Operation(summary = "Delete a hangout")
    public Response deleteHangout(@PathParam("authHangoutId") String authHangoutId) {
        hangoutBusinessLogic.deleteHangout(authHangoutId);
        return Response.noContent().build();
    }

    @POST
    @Path("/{authHangoutId}/invitations/{authUserId}")
    @Operation(summary = "Invite a user to a hangout")
    public HangoutModelResponse inviteUser(
            @PathParam("authHangoutId") String authHangoutId,
            @PathParam("authUserId") String authUserId
    ) {
        return hangoutBusinessLogic.inviteUser(authHangoutId, authUserId);
    }

    @POST
    @Path("/{authHangoutId}/join/{authUserId}")
    @Operation(summary = "Accept an invitation or join an open hangout")
    public HangoutModelResponse joinHangout(
            @PathParam("authHangoutId") String authHangoutId,
            @PathParam("authUserId") String authUserId
    ) {
        return hangoutBusinessLogic.joinHangout(authHangoutId, authUserId);
    }
}
