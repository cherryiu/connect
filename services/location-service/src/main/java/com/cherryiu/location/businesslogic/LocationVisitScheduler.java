package com.cherryiu.location.businesslogic;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import static io.quarkus.scheduler.Scheduled.ConcurrentExecution.SKIP;

@ApplicationScoped
public class LocationVisitScheduler {

    @Inject
    LocationBusinessLogic locationBusinessLogic;

    /** Process newly completed hangouts without requiring a client to be open. */
    @Scheduled(every = "60s", delay = 5, concurrentExecution = SKIP)
    void recordCompletedHangouts() {
        locationBusinessLogic.syncCompletedHangouts();
    }
}
