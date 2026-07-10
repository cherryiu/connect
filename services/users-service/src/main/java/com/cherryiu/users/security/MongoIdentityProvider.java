package com.cherryiu.users.security;

import com.cherryiu.users.model.UserProfile;
import com.cherryiu.users.repository.UserProfileRepository;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.security.AuthenticationFailedException;
import io.quarkus.security.identity.AuthenticationRequestContext;
import io.quarkus.security.identity.IdentityProvider;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.identity.request.UsernamePasswordAuthenticationRequest;
import io.quarkus.security.runtime.QuarkusSecurityIdentity;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

// implement mongo identity provider for DB
@ApplicationScoped
public class MongoIdentityProvider implements IdentityProvider<UsernamePasswordAuthenticationRequest> {
  
  @Inject
  UserProfileRepository userProfileRepository;

  @Override
  public Class<UsernamePasswordAuthenticationRequest> getRequestType() {
    return UsernamePasswordAuthenticationRequest.class;
  }

  @Override
  public Uni<SecurityIdentity> authenticate(
    UsernamePasswordAuthenticationRequest request,
            AuthenticationRequestContext context
  ) {
      return context.runBlocking(() -> {
            String email = request.getUsername();
            String password = new String(request.getPassword().getPassword());

            UserProfile user = userProfileRepository
                    .findByEmail(email)
                    .orElse(null);

            // check database for password
            if (user == null || !BcryptUtil.matches(password, user.password)) {
                throw new AuthenticationFailedException();
            }

            return QuarkusSecurityIdentity.builder()
                    .setPrincipal(() -> user.email)
                    .addRole(user.role != null ? user.role : "user")
                    .addAttribute("userId", user.id != null ? user.id.toString() : null)
                    .addAttribute("displayName", user.displayName)
                    .addAttribute("avatarUrl", user.avatarUrl)
                    .build();
        });
  }

}
