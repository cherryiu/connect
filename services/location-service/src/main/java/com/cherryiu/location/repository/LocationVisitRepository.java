package com.cherryiu.location.repository;

import com.cherryiu.location.model.LocationVisit;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class LocationVisitRepository implements PanacheMongoRepository<LocationVisit> {

    void createIndexes(@Observes StartupEvent ignored) {
        // A completed hangout may be processed repeatedly. This index guarantees
        // that each participant receives at most one visit for that hangout.
        mongoCollection().createIndex(
                Indexes.compoundIndex(
                        Indexes.ascending("authUserId"),
                        Indexes.ascending("authHangoutId")
                ),
                new IndexOptions().unique(true)
        );
        mongoCollection().createIndex(
                Indexes.compoundIndex(
                        Indexes.ascending("locationKey"),
                        Indexes.ascending("authUserId")
                )
        );
    }

    public Optional<LocationVisit> findByUserAndHangout(ObjectId userId, ObjectId hangoutId) {
        return find("authUserId = ?1 and authHangoutId = ?2", userId, hangoutId)
                .firstResultOptional();
    }

    public List<LocationVisit> findByUser(ObjectId userId) {
        return find("authUserId", userId).list();
    }

    public List<LocationVisit> findFriendsAtLocation(
            String locationKey,
            Collection<ObjectId> friendIds
    ) {
        if (friendIds.isEmpty()) {
            return List.of();
        }
        return mongoCollection()
                .find(Filters.and(
                        Filters.eq("locationKey", locationKey),
                        Filters.in("authUserId", friendIds)
                ))
                .into(new ArrayList<>());
    }
}
