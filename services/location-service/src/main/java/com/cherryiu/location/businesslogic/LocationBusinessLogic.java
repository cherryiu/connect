package com.cherryiu.location.businesslogic;

import com.cherryiu.location.dto.FriendLocationVisitRequest;
import com.cherryiu.location.dto.FriendLocationVisitResponse;
import com.cherryiu.location.dto.PendingVisitResponse;
import com.cherryiu.location.dto.StandaloneOrderRequest;
import com.cherryiu.location.dto.LocationVisitDetail;
import com.cherryiu.location.dto.LocationVisitSummary;
import com.cherryiu.location.dto.VisitJournalRequest;
import com.cherryiu.location.dto.VisitSyncResponse;
import com.cherryiu.location.model.HangoutRecord;
import com.cherryiu.location.model.LocationVisit;
import com.cherryiu.location.model.StandaloneOrder;
import com.cherryiu.location.repository.HangoutRecordRepository;
import com.cherryiu.location.repository.LocationVisitRepository;
import com.cherryiu.location.repository.StandaloneOrderRepository;
import com.mongodb.ErrorCategory;
import com.mongodb.MongoWriteException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import org.bson.types.ObjectId;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

@ApplicationScoped
public class LocationBusinessLogic {

    private static final String DEFAULT_ORDER_DESCRIPTION = "No order noted";

    @Inject
    HangoutRecordRepository hangoutRepository;

    @Inject
    LocationVisitRepository visitRepository;

    @Inject
    StandaloneOrderRepository standaloneOrderRepository;

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
            if (Boolean.FALSE.equals(visit.attendanceConfirmed)) {
                continue;
            }
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

    /** Returns each visit at one place, newest first, without collapsing repeat visits. */
    public List<LocationVisitDetail> getUserVisitHistory(String authUserId, String location) {
        ObjectId userId = parseObjectId(authUserId, "user");
        String locationKey = normalizeKey(location);
        if (locationKey.isEmpty()) {
            throw new BadRequestException("Location is required");
        }

        Stream<LocationVisitDetail> visits = visitRepository.findByUserAtLocation(userId, locationKey).stream()
                .filter(visit -> !Boolean.FALSE.equals(visit.attendanceConfirmed))
                .map(visit -> toVisitDetail(visit, userId));
        Stream<LocationVisitDetail> standaloneOrders = standaloneOrderRepository
                .findByUserAtLocation(userId, locationKey)
                .stream()
                .map(this::toStandaloneOrderDetail);

        return Stream.concat(visits, standaloneOrders)
                .sorted(Comparator.comparing(
                        LocationVisitDetail::visitedAt,
                        Comparator.reverseOrder()
                ))
                .toList();
    }

    public LocationVisitDetail createStandaloneOrder(
            String authUserId,
            StandaloneOrderRequest request
    ) {
        ObjectId userId = parseObjectId(authUserId, "user");
        String locationName = normalizeDisplayName(request.location());
        if (locationName.isEmpty()) {
            throw new BadRequestException("Location is required");
        }

        StandaloneOrder order = new StandaloneOrder();
        order.authUserId = userId;
        order.locationName = locationName;
        order.locationKey = normalizeKey(locationName);
        order.orderedAt = Instant.now();
        order.orderDescription = request.orderDescription().trim();
        order.orderRating = request.orderRating();
        order.notes = trimToNull(request.notes());
        order.createdAt = Instant.now();
        standaloneOrderRepository.persist(order);
        return toStandaloneOrderDetail(order);
    }

    public LocationVisitDetail updateStandaloneOrder(
            String authUserId,
            String orderId,
            VisitJournalRequest request
    ) {
        ObjectId userId = parseObjectId(authUserId, "user");
        StandaloneOrder order = standaloneOrderRepository
                .findByIdAndUser(parseObjectId(orderId, "order"), userId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        String orderDescription = trimToNull(request.orderDescription());
        if (orderDescription == null) {
            throw new BadRequestException("Order description is required");
        }
        order.orderDescription = orderDescription;
        order.orderRating = request.orderRating();
        order.notes = trimToNull(request.notes());
        standaloneOrderRepository.update(order);
        return toStandaloneOrderDetail(order);
    }

    public void deleteVisit(String authUserId, String authHangoutId) {
        LocationVisit visit = findVisit(authUserId, authHangoutId);
        // Keep a tombstone so the completed-hangout sync does not recreate a
        // visit the user deliberately removed from their history.
        visit.attendanceConfirmed = false;
        visitRepository.update(visit);
    }

    public void deleteStandaloneOrder(String authUserId, String orderId) {
        ObjectId userId = parseObjectId(authUserId, "user");
        StandaloneOrder order = standaloneOrderRepository
                .findByIdAndUser(parseObjectId(orderId, "order"), userId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        standaloneOrderRepository.delete(order);
    }

    public List<PendingVisitResponse> getPendingVisits(String authUserId) {
        ObjectId userId = parseObjectId(authUserId, "user");
        return visitRepository.findByUser(userId).stream()
                .filter(visit -> !Boolean.FALSE.equals(visit.attendanceConfirmed))
                .filter(visit -> visit.attendanceConfirmed == null
                        || !hasRecordedOrder(visit.orderDescription))
                .sorted(Comparator.comparing(
                        (LocationVisit visit) -> visit.visitedAt,
                        Comparator.reverseOrder()
                ))
                .map(this::toPendingVisit)
                .toList();
    }

    public void confirmAttendance(String authUserId, String authHangoutId, boolean attended) {
        LocationVisit visit = findVisit(authUserId, authHangoutId);
        visit.attendanceConfirmed = attended;
        visitRepository.update(visit);
    }

    public LocationVisitDetail updateVisitJournal(
            String authUserId,
            String authHangoutId,
            VisitJournalRequest request
    ) {
        ObjectId userId = parseObjectId(authUserId, "user");
        LocationVisit visit = findVisit(userId, parseObjectId(authHangoutId, "hangout"));
        visit.orderDescription = trimToNull(request.orderDescription());
        visit.orderRating = request.orderRating();
        visit.notes = trimToNull(request.notes());
        visitRepository.update(visit);
        return toVisitDetail(visit, userId);
    }

    public List<FriendLocationVisitResponse> getFriendVisits(FriendLocationVisitRequest request) {
        String locationKey = normalizeKey(request.location());
        List<ObjectId> friendIds = request.friendAuthUserIds().stream()
                .distinct()
                .map(id -> parseObjectId(id, "friend user"))
                .toList();
        var summaries = new LinkedHashMap<ObjectId, MutableFriendSummary>();

        for (LocationVisit visit : visitRepository.findFriendsAtLocation(locationKey, friendIds)) {
            if (Boolean.FALSE.equals(visit.attendanceConfirmed)) {
                continue;
            }
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
        visit.hangoutName = hangout.hangoutName;
        visit.locationName = locationName;
        visit.locationKey = normalizeKey(locationName);
        visit.visitedAt = hangout.endTime.toInstant();
        visit.createdAt = Instant.now();
        visit.orderDescription = DEFAULT_ORDER_DESCRIPTION;
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

    private LocationVisitDetail toVisitDetail(LocationVisit visit, ObjectId userId) {
        List<String> companionIds = hangoutRepository.findByAuthHangoutId(visit.authHangoutId)
                .map(hangout -> hangout.participantAuthUserIds.stream()
                        .filter(participantId -> !participantId.equals(userId))
                        .distinct()
                        .map(ObjectId::toHexString)
                        .toList())
                .orElseGet(List::of);

        return new LocationVisitDetail(
                visit.authHangoutId.toHexString(),
                visit.authHangoutId.toHexString(),
                visit.locationName,
                visit.visitedAt,
                companionIds,
                visit.orderDescription,
                visit.orderRating,
                visit.notes,
                visit.attendanceConfirmed,
                false
        );
    }

    private LocationVisitDetail toStandaloneOrderDetail(StandaloneOrder order) {
        return new LocationVisitDetail(
                order.id.toHexString(),
                null,
                order.locationName,
                order.orderedAt,
                List.of(),
                order.orderDescription,
                order.orderRating,
                order.notes,
                true,
                true
        );
    }

    private PendingVisitResponse toPendingVisit(LocationVisit visit) {
        String hangoutName = visit.hangoutName;
        if (hangoutName == null || hangoutName.isBlank()) {
            hangoutName = hangoutRepository.findByAuthHangoutId(visit.authHangoutId)
                    .map(hangout -> hangout.hangoutName)
                    .orElse(null);
        }
        return new PendingVisitResponse(
                visit.authHangoutId.toHexString(),
                hangoutName,
                visit.locationName,
                visit.visitedAt,
                visit.attendanceConfirmed
        );
    }

    private LocationVisit findVisit(String authUserId, String authHangoutId) {
        return findVisit(
                parseObjectId(authUserId, "user"),
                parseObjectId(authHangoutId, "hangout")
        );
    }

    private LocationVisit findVisit(ObjectId userId, ObjectId hangoutId) {
        return visitRepository.findByUserAndHangout(userId, hangoutId)
                .orElseThrow(() -> new NotFoundException("Visit not found"));
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

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean hasRecordedOrder(String orderDescription) {
        return orderDescription != null
                && !orderDescription.isBlank()
                && !DEFAULT_ORDER_DESCRIPTION.equalsIgnoreCase(orderDescription.trim());
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
