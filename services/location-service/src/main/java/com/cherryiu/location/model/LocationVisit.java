package com.cherryiu.location.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import org.bson.types.ObjectId;

import java.time.Instant;

/** One user's attendance at one completed hangout location. */
@MongoEntity(collection = "location_visits")
public class LocationVisit extends PanacheMongoEntity {

    public ObjectId authUserId;
    public ObjectId authHangoutId;
    public String locationName;
    public String locationKey;
    public Instant visitedAt;
    public Instant createdAt;
}
