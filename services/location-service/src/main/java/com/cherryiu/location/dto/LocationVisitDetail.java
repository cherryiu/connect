package com.cherryiu.location.dto;

import java.time.Instant;
import java.util.List;

/** A single completed visit shown in a place's chronological history. */
public record LocationVisitDetail(
        String entryId,
        String authHangoutId,
        String location,
        Instant visitedAt,
        List<String> companionAuthUserIds,
        String orderDescription,
        Integer orderRating,
        String notes,
        Boolean attendanceConfirmed,
        boolean standaloneOrder
) {
}
