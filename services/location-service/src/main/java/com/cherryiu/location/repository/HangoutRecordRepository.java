package com.cherryiu.location.repository;

import com.cherryiu.location.model.HangoutRecord;
import com.mongodb.client.model.Filters;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class HangoutRecordRepository implements PanacheMongoRepository<HangoutRecord> {

    public List<HangoutRecord> findCompletedBefore(Instant cutoff) {
        return mongoCollection()
                .find(Filters.and(
                        Filters.lte("endTime", Date.from(cutoff)),
                        Filters.ne("location", null),
                        Filters.ne("location", "")
                ))
                .into(new ArrayList<>());
    }
}
