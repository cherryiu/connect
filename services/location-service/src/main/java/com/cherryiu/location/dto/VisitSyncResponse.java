package com.cherryiu.location.dto;

public record VisitSyncResponse(
        int completedHangoutsProcessed,
        int visitsRecorded
) {
}
