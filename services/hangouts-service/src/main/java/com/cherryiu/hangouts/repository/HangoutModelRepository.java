package com.cherryiu.hangouts.repository;

import com.cherryiu.hangouts.model.HangoutModel;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import org.bson.types.ObjectId;

import java.util.Optional;
import java.util.List;

@ApplicationScoped
public class HangoutModelRepository implements PanacheMongoRepository<HangoutModel> {

    public Optional<HangoutModel> findByAuthHangoutId(ObjectId authHangoutId) {
        return find("authHangoutId", authHangoutId).firstResultOptional();
    }

    public List<HangoutModel> findByParticipantAuthUserId(ObjectId participantAuthUserId) {
        return find("participantAuthUserIds", participantAuthUserId).list();
    }
}
