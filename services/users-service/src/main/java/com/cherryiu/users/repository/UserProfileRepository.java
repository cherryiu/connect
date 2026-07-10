package com.cherryiu.users.repository;

import com.cherryiu.users.model.UserProfile;

import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class UserProfileRepository implements PanacheMongoRepository<UserProfile> {

    public Optional<UserProfile> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }
}
