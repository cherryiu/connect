package com.cherryiu.location.businesslogic;

import com.cherryiu.location.dto.FriendLocationVisitRequest;
import com.cherryiu.location.dto.FriendLocationVisitResponse;
import com.cherryiu.location.dto.LocationVisitSummary;
import com.cherryiu.location.dto.VisitSyncResponse;
import com.cherryiu.location.model.HangoutRecord;
import com.cherryiu.location.model.LocationVisit;
import com.cherryiu.location.repository.HangoutRecordRepository;
import com.cherryiu.location.repository.LocationVisitRepository;
import com.mongodb.ErrorCategory;
import com.mongodb.MongoWriteException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import org.bson.types.ObjectId;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class LocationBusinessLogic {

    @Inject
    HangoutRecordRepository hangoutRepository;

    @Inject
    LocationVisitRepository visitRepository;

    /**
     * Records visits for every participant of every completed hangout. Repeated
     * runs are safe because a user/hangout pair is unique in MongoDB.
     */
    public VisitSyncResponse syncCompletedHangouts() {
        List<HangoutRecord> completedHangouts = hangoutRepository.findCompletedBefore(Instant.now());
        int visitsRecorded = 0;

        for (HangoutRecord hangout : completedHangouts) {
            if (hangout.authHangoutId == null || hangout.participantAuthUserIds == null) {
                continue;
            }
            String locationName = normalizeDisplayName(hangout.location);
            if (locationName.isEmpty()) {
                continue;
            }

            for (ObjectId participantId : hangout.participantAuthUserIds.stream().distinct().toList()) {
                if (recordVisitIfMissing(hangout, participantId, locationName)) {
                    visitsRecorded++;
                }
            }
        }

        return new VisitSyncResponse(completedHangouts.size(), visitsRecorded);
    }

    public List<LocationVisitSummary> getUserVisits(String authUserId) {
        ObjectId userId = parseObjectId(authUserId, "user");
        var summaries = new LinkedHashMap<String, MutableSummary>();

        for (LocationVisit visit : visitRepository.findByUser(userId)) {
            summaries.computeIfAbsent(
                    visit.locationKey,
                    ignored -> new MutableSummary(visit.locationName)
            ).include(visit.visitedAt);
        }

        return summaries.values().stream()
                .map(MutableSummary::toLocationSummary)
                .sorted(Comparator.comparing(
                        LocationVisitSummary::lastVisitedAt,
                        Comparator.reverseOrder()
                ))
                .toList();
    }

    public List<FriendLocationVisitResponse> getFriendVisits(FriendLocationVisitRequest request) {
        String locationKey = normalizeKey(request.location());
        List<ObjectId> friendIds = request.friendAuthUserIds().stream()
                .distinct()
                .map(id -> parseObjectId(id, "friend user"))
                .toList();
        var summaries = new LinkedHashMap<ObjectId, MutableFriendSummary>();

        for (LocationVisit visit : visitRepository.findFriendsAtLocation(locationKey, friendIds)) {
            summaries.computeIfAbsent(
                    visit.authUserId,
                    ignored -> new MutableFriendSummary(visit.authUserId)
            ).include(visit.visitedAt);
        }

        return summaries.values().stream()
                .map(MutableFriendSummary::toResponse)
                .sorted(Comparator.comparing(
                        FriendLocationVisitResponse::lastVisitedAt,
                        Comparator.reverseOrder()
                ))
                .toList();
    }

    private boolean recordVisitIfMissing(
            HangoutRecord hangout,
            ObjectId participantId,
            String locationName
    ) {
        if (visitRepository.findByUserAndHangout(participantId, hangout.authHangoutId).isPresent()) {
            return false;
        }

        LocationVisit visit = new LocationVisit();
        visit.authUserId = participantId;
        visit.authHangoutId = hangout.authHangoutId;
        visit.locationName = locationName;
        visit.locationKey = normalizeKey(locationName);
        visit.visitedAt = hangout.endTime.toInstant();
        visit.createdAt = Instant.now();
        try {
            visitRepository.persist(visit);
            return true;
        } catch (MongoWriteException exception) {
            // A concurrent sync may have inserted the same unique visit first.
            if (exception.getError().getCategory() == ErrorCategory.DUPLICATE_KEY) {
                return false;
            }
            throw exception;
        }
    }

    private ObjectId parseObjectId(String id, String label) {
        if (!ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid " + label + " id");
        }
        return new ObjectId(id);
    }

    private String normalizeDisplayName(String location) {
        return location == null ? "" : location.trim().replaceAll("\\s+", " ");
    }

    private String normalizeKey(String location) {
        return normalizeDisplayName(location).toLowerCase(Locale.ROOT);
    }

    private static final class MutableSummary {
        private final String locationName;
        private int count;
        private Instant lastVisitedAt;

        private MutableSummary(String locationName) {
            this.locationName = locationName;
        }

        private void include(Instant visitedAt) {
            count++;
            if (lastVisitedAt == null || visitedAt.isAfter(lastVisitedAt)) {
                lastVisitedAt = visitedAt;
            }
        }

        private LocationVisitSummary toLocationSummary() {
            return new LocationVisitSummary(locationName, count, lastVisitedAt);
        }
    }

    private static final class MutableFriendSummary {
        private final ObjectId authUserId;
        private int count;
        private Instant lastVisitedAt;

        private MutableFriendSummary(ObjectId authUserId) {
            this.authUserId = authUserId;
        }

        private void include(Instant visitedAt) {
            count++;
            if (lastVisitedAt == null || visitedAt.isAfter(lastVisitedAt)) {
                lastVisitedAt = visitedAt;
            }
        }

        private FriendLocationVisitResponse toResponse() {
            return new FriendLocationVisitResponse(authUserId.toHexString(), count, lastVisitedAt);
        }
    }
}
