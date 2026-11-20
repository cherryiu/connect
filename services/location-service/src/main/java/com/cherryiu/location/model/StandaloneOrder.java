package com.cherryiu.location.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import org.bson.types.ObjectId;

import java.time.Instant;

/** An order journal entry that is not associated with a completed hangout. */
@MongoEntity(collection = "standalone_orders")
public class StandaloneOrder extends PanacheMongoEntity {

    public ObjectId authUserId;
    public String locationName;
    public String locationKey;
    public Instant orderedAt;
    public String orderDescription;
    public Integer orderRating;
    public String notes;
    public Instant createdAt;
}
