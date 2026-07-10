package com.cherryiu.location.api;

import com.cherryiu.location.dto.LocationRequest;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.MediaType;

@Path("/locations")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class LocationResource {

    @POST
    @Path("/ping")
    @Produces(MediaType.TEXT_PLAIN)
    public String ping() {
        return "location-service is running";
    }   

    


    // @POST
    // @Path("/save")
    // public Response saveLocation(LocationRequest request) {
    //     // 1. Get authenticated user ID
    //     // 2. Validate location
    //     // 3. Save to MongoDB
    //     // 4. Return response
    //     return Response.status(Response.Status.CREATED).build();
    // }



    
}
