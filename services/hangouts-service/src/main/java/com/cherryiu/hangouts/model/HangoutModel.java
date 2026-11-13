package com.cherryiu.hangouts.model;

import io.quarkus.mongodb.panache.common.MongoEntity;
import io.quarkus.mongodb.panache.PanacheMongoEntity;
import org.bson.types.ObjectId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;

@MongoEntity(collection = "hangouts")
public class HangoutModel extends PanacheMongoEntity {

    public ObjectId authHangoutId;
    public ArrayList<ObjectId> participantAuthUserIds = new ArrayList<>();
    public ArrayList<ObjectId> invitedAuthUserIds = new ArrayList<>();
    public String hangoutName;
    public String location;
    public Date startTime;
    public Date endTime;
    public String description;
    public Boolean isOpen;
    public Instant createdAt;
    public Instant updatedAt;
    
}
