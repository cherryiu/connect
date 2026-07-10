package com.cherryiu.users.exception;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String userId) {
        super("User profile not found for userId: " + userId);
    }
}
