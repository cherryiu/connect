package com.cherryiu.hangouts.exception;

public class HangoutNotFoundException extends RuntimeException {

    public HangoutNotFoundException(String authHangoutId) {
        super("Hangout not found for authHangoutId: " + authHangoutId);
    }
}
