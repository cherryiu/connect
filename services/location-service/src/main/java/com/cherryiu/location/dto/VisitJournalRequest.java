package com.cherryiu.location.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record VisitJournalRequest(
        @Size(max = 500) String orderDescription,
        @Min(1) @Max(5) Integer orderRating,
        @Size(max = 1000) String notes
) {
}
