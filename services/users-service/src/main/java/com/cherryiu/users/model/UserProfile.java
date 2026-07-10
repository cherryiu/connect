package com.cherryiu.users.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import java.time.Instant;

public class UserProfile extends PanacheMongoEntity {

    public String displayName;
    public String email;
    public String password;
    public String role;
    public String avatarUrl;
    public String bio;
    public Instant createdAt;
    public Instant updatedAt;
}
