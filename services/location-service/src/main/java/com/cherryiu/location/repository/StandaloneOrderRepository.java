package com.cherryiu.location.repository;

import com.cherryiu.location.model.StandaloneOrder;
import com.mongodb.client.model.Indexes;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.bson.types.ObjectId;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class StandaloneOrderRepository implements PanacheMongoRepository<StandaloneOrder> {

    void createIndexes(@Observes StartupEvent ignored) {
        mongoCollection().createIndex(
                Indexes.compoundIndex(
                        Indexes.ascending("authUserId"),
                        Indexes.ascending("locationKey"),
                        Indexes.descending("orderedAt")
                )
        );
    }

    public List<StandaloneOrder> findByUserAtLocation(ObjectId userId, String locationKey) {
        return find("authUserId = ?1 and locationKey = ?2", userId, locationKey).list();
    }

    public Optional<StandaloneOrder> findByIdAndUser(ObjectId orderId, ObjectId userId) {
        return find("_id = ?1 and authUserId = ?2", orderId, userId).firstResultOptional();
    }
}
