package com.cherryiu.location.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StandaloneOrderRequest(
        @NotBlank @Size(max = 200) String location,
        @NotBlank @Size(max = 500) String orderDescription,
        @Min(1) @Max(5) Integer orderRating,
        @Size(max = 1000) String notes
) {
}
