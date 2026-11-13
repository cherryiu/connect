package com.cherryiu.users.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import org.bson.types.ObjectId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class UserProfile extends PanacheMongoEntity {

    public String displayName;
    public String email;
    public String password;
    public String role;
    public String avatarUrl;
    public String bio;
    public Instant createdAt;
    public Instant updatedAt;

    /** Store references instead of embedding complete user documents. */
    public List<ObjectId> friendIds = new ArrayList<>();
}
