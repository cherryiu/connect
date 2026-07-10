package com.cherryiu.users.api;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import com.cherryiu.users.businesslogic.AuthBusinessLogic;
import com.cherryiu.users.dto.AuthStatusResponse;

import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@Tag(name = "User Authentication")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

  @Inject
  AuthBusinessLogic authBusinessLogic;

  // quarkus has build in login endpoing (/j_security_check)

  @POST
  @Path("/logout")
  @Operation(summary = "Log out a user")
  public Response logout() {
    return authBusinessLogic.logout();
  }

  @GET
  @PermitAll
  @Path("/status")
  @Operation(summary = "Check authentication status")
  public AuthStatusResponse status() {
    return authBusinessLogic.status();
  }

// POST /auth/register
// POST /auth/login
// POST /auth/logout
// POST /auth/refresh
  
}
