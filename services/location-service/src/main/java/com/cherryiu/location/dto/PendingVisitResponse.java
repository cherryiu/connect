package com.cherryiu.location.dto;

import java.time.Instant;

/** A completed hangout still awaiting attendance confirmation or an order entry. */
public record PendingVisitResponse(
        String authHangoutId,
        String hangoutName,
        String location,
        Instant visitedAt,
        Boolean attendanceConfirmed
) {
}
