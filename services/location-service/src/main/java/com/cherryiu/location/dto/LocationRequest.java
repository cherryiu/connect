package com.cherryiu.location.dto;

public record LocationRequest(
    String authUserId, 
    String placeId, 
    String address,
    double latitude,
    double longitude
) {}
