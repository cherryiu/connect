package com.cherryiu.users.businesslogic;

import com.cherryiu.users.dto.AuthStatusResponse;
import com.cherryiu.users.exception.UserNotFoundException;
import com.cherryiu.users.mapper.ResponseMapper;
import com.cherryiu.users.model.UserProfile;
import com.cherryiu.users.repository.UserProfileRepository;

import io.quarkus.security.UnauthorizedException;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.vertx.http.runtime.security.FormAuthenticationMechanism;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import org.bson.types.ObjectId;

@ApplicationScoped
public class AuthBusinessLogic {

  @Inject
  UserProfileRepository userProfileRepository;

  @Inject
  SecurityIdentity identity;

  @Inject
  ResponseMapper responseMapper;

  public Response login() {
      if (identity.isAnonymous()) {
          throw new UnauthorizedException("Not authenticated");
      }
      return Response.noContent().build();
  }


  public Response logout() {
      if (identity.isAnonymous()) {
          throw new UnauthorizedException("Not authenticated");
      }
      FormAuthenticationMechanism.logout(identity); 
      return Response.noContent().build();
  }
  
  // get login status of current session using cookies
  public AuthStatusResponse status() {

    // if browser doesnt have valid session cookie, return false login
    if (identity.isAnonymous()) {
        return AuthStatusResponse.anonymous();
    }

    String userId = identity.getAttribute("userId");
    
    UserProfile profile = userProfileRepository
                            .findByIdOptional(new ObjectId(userId))
                            .orElseThrow(() -> new UserNotFoundException(userId));   

    return responseMapper.toAuthResponse(profile, true);
      
  }

}
