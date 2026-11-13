package com.cherryiu.location.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.Date;

/**
 * Read-only projection of the hangout document owned by hangouts-service.
 * Location-service uses it to turn completed attendance into location visits.
 */
@MongoEntity(collection = "hangouts")
public class HangoutRecord extends PanacheMongoEntity {

    public ObjectId authHangoutId;
    public ArrayList<ObjectId> participantAuthUserIds = new ArrayList<>();
    public String location;
    public Date endTime;
}
