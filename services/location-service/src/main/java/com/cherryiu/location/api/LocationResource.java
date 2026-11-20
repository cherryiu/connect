package com.cherryiu.location.api;

import com.cherryiu.location.businesslogic.LocationBusinessLogic;
import com.cherryiu.location.dto.FriendLocationVisitRequest;
import com.cherryiu.location.dto.FriendLocationVisitResponse;
import com.cherryiu.location.dto.AttendanceConfirmationRequest;
import com.cherryiu.location.dto.LocationVisitDetail;
import com.cherryiu.location.dto.LocationVisitSummary;
import com.cherryiu.location.dto.PendingVisitResponse;
import com.cherryiu.location.dto.StandaloneOrderRequest;
import com.cherryiu.location.dto.VisitJournalRequest;
import com.cherryiu.location.dto.VisitSyncResponse;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
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

    @GET
    @Path("/visits/users/{authUserId}/history")
    @Operation(summary = "Get a user's individual visits at one location")
    public List<LocationVisitDetail> getUserVisitHistory(
            @PathParam("authUserId") String authUserId,
            @QueryParam("location") String location
    ) {
        return locationBusinessLogic.getUserVisitHistory(authUserId, location);
    }

    @GET
    @Path("/visits/users/{authUserId}/pending")
    @Operation(summary = "Get completed hangouts awaiting attendance confirmation")
    public List<PendingVisitResponse> getPendingVisits(
            @PathParam("authUserId") String authUserId
    ) {
        return locationBusinessLogic.getPendingVisits(authUserId);
    }

    @PUT
    @Path("/visits/users/{authUserId}/hangouts/{authHangoutId}/attendance")
    @Operation(summary = "Confirm whether a user attended a completed hangout")
    public void confirmAttendance(
            @PathParam("authUserId") String authUserId,
            @PathParam("authHangoutId") String authHangoutId,
            @Valid AttendanceConfirmationRequest request
    ) {
        locationBusinessLogic.confirmAttendance(authUserId, authHangoutId, request.attended());
    }

    @PUT
    @Path("/visits/users/{authUserId}/hangouts/{authHangoutId}/journal")
    @Operation(summary = "Update an order, rating, and notes for one visit")
    public LocationVisitDetail updateVisitJournal(
            @PathParam("authUserId") String authUserId,
            @PathParam("authHangoutId") String authHangoutId,
            @Valid VisitJournalRequest request
    ) {
        return locationBusinessLogic.updateVisitJournal(authUserId, authHangoutId, request);
    }

    @POST
    @Path("/visits/users/{authUserId}/orders")
    @Operation(summary = "Add an order journal entry without a hangout visit")
    public LocationVisitDetail createStandaloneOrder(
            @PathParam("authUserId") String authUserId,
            @Valid StandaloneOrderRequest request
    ) {
        return locationBusinessLogic.createStandaloneOrder(authUserId, request);
    }

    @PUT
    @Path("/visits/users/{authUserId}/orders/{orderId}")
    @Operation(summary = "Update a standalone order journal entry")
    public LocationVisitDetail updateStandaloneOrder(
            @PathParam("authUserId") String authUserId,
            @PathParam("orderId") String orderId,
            @Valid VisitJournalRequest request
    ) {
        return locationBusinessLogic.updateStandaloneOrder(authUserId, orderId, request);
    }

    @DELETE
    @Path("/visits/users/{authUserId}/hangouts/{authHangoutId}")
    @Operation(summary = "Remove a hangout visit from a user's history")
    public void deleteVisit(
            @PathParam("authUserId") String authUserId,
            @PathParam("authHangoutId") String authHangoutId
    ) {
        locationBusinessLogic.deleteVisit(authUserId, authHangoutId);
    }

    @DELETE
    @Path("/visits/users/{authUserId}/orders/{orderId}")
    @Operation(summary = "Delete a standalone order journal entry")
    public void deleteStandaloneOrder(
            @PathParam("authUserId") String authUserId,
            @PathParam("orderId") String orderId
    ) {
        locationBusinessLogic.deleteStandaloneOrder(authUserId, orderId);
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
