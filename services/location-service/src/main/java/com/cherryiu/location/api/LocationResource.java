package com.cherryiu.location.api;

import com.cherryiu.location.businesslogic.LocationBusinessLogic;
import com.cherryiu.location.dto.FriendLocationVisitRequest;
import com.cherryiu.location.dto.FriendLocationVisitResponse;
import com.cherryiu.location.dto.LocationVisitSummary;
import com.cherryiu.location.dto.VisitSyncResponse;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import org.eclipse.microprofile.openapi.annotations.Operation;

import java.util.List;

@Path("/locations")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class LocationResource {

    @Inject
    LocationBusinessLogic locationBusinessLogic;

    @GET
    @Path("/ping")
    @Produces(MediaType.TEXT_PLAIN)
    public String ping() {
        return "location-service is running";
    }

    @POST
    @Path("/visits/sync")
    @Operation(summary = "Record visits from completed hangouts")
    public VisitSyncResponse syncCompletedHangouts() {
        return locationBusinessLogic.syncCompletedHangouts();
    }

    @GET
    @Path("/visits/users/{authUserId}")
    @Operation(summary = "Get a user's visit counts grouped by location")
    public List<LocationVisitSummary> getUserVisits(
            @PathParam("authUserId") String authUserId
    ) {
        return locationBusinessLogic.getUserVisits(authUserId);
    }

    @POST
    @Path("/visits/friends")
    @Operation(summary = "Find friends who have visited a location")
    public List<FriendLocationVisitResponse> getFriendVisits(
            @Valid FriendLocationVisitRequest request
    ) {
        return locationBusinessLogic.getFriendVisits(request);
    }
}
