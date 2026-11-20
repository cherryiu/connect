package com.cherryiu.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record FriendLocationVisitRequest(
        @NotBlank @Size(max = 200) String location,
        @NotEmpty @Size(max = 100)
        List<@Pattern(regexp = "^[0-9a-fA-F]{24}$") String> friendAuthUserIds
) {
}
