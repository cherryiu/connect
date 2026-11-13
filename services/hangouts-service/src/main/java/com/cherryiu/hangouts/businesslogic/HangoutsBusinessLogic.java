package com.cherryiu.hangouts.businesslogic;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.core.Response;
import org.bson.types.ObjectId;

import com.cherryiu.hangouts.dto.HangoutModelRequest;
import com.cherryiu.hangouts.dto.HangoutModelResponse;
import com.cherryiu.hangouts.exception.HangoutNotFoundException;
import com.cherryiu.hangouts.mapper.HangoutMapper;
import com.cherryiu.hangouts.model.HangoutModel;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import com.cherryiu.hangouts.repository.HangoutModelRepository;

@ApplicationScoped
public class HangoutsBusinessLogic {

    @Inject
    HangoutModelRepository hangoutRepository;

    @Inject
    HangoutMapper hangoutMapper;

    public HangoutModelResponse getHangout(String authHangoutId) {
        HangoutModel hangout = findHangoutOrThrow(authHangoutId);
        return hangoutMapper.toResponse(hangout);
    }

    public List<HangoutModelResponse> getHangoutsForUser(String authUserId) {
        ObjectId userId = parseObjectId(authUserId, "user");
        LinkedHashMap<ObjectId, HangoutModel> matches = new LinkedHashMap<>();
        hangoutRepository.findByParticipantAuthUserId(userId)
                .forEach(hangout -> matches.put(hangout.id, hangout));
        hangoutRepository.findByInvitedAuthUserId(userId)
                .forEach(hangout -> matches.put(hangout.id, hangout));
        hangoutRepository.findOpen()
                .forEach(hangout -> matches.put(hangout.id, hangout));

        return matches.values().stream()
                .map(hangoutMapper::toResponse)
                .toList();
    }

    public HangoutModelResponse createHangout(String authHangoutId, HangoutModelRequest request) {
        ObjectId hangoutId = parseObjectId(authHangoutId, "hangout");
        if (hangoutRepository.findByAuthHangoutId(hangoutId).isPresent()) {
            throw new ClientErrorException("Hangout id already exists", Response.Status.CONFLICT);
        }
        validateRequest(request);
        HangoutModel hangout = hangoutMapper.toNewEntity(hangoutId, request);
        hangoutRepository.persist(hangout);
        return hangoutMapper.toResponse(hangout);
    }

    public HangoutModelResponse updateHangout(String authHangoutId, HangoutModelRequest request) {
        HangoutModel hangout = findHangoutOrThrow(authHangoutId);
        validateRequest(request);
        hangoutMapper.applyRequest(hangout, request);
        hangoutRepository.update(hangout);
        return hangoutMapper.toResponse(hangout);
    }

    public void deleteHangout(String authHangoutId) {
        HangoutModel hangout = findHangoutOrThrow(authHangoutId);
        hangoutRepository.delete(hangout);
    }

    public HangoutModelResponse inviteUser(String authHangoutId, String authUserId) {
        HangoutModel hangout = findHangoutOrThrow(authHangoutId);
        ensureMembershipLists(hangout);
        ObjectId userId = parseObjectId(authUserId, "user");
        if (!hangout.participantAuthUserIds.contains(userId)
                && !hangout.invitedAuthUserIds.contains(userId)) {
            hangout.invitedAuthUserIds.add(userId);
            hangout.updatedAt = Instant.now();
            hangoutRepository.update(hangout);
        }
        return hangoutMapper.toResponse(hangout);
    }

    public HangoutModelResponse joinHangout(String authHangoutId, String authUserId) {
        HangoutModel hangout = findHangoutOrThrow(authHangoutId);
        ensureMembershipLists(hangout);
        ObjectId userId = parseObjectId(authUserId, "user");
        if (hangout.participantAuthUserIds.contains(userId)) {
            return hangoutMapper.toResponse(hangout);
        }
        boolean invited = hangout.invitedAuthUserIds.contains(userId);
        if (!Boolean.TRUE.equals(hangout.isOpen) && !invited) {
            throw new ForbiddenException("This hangout is closed and requires an invitation");
        }

        if (!hangout.participantAuthUserIds.contains(userId)) {
            hangout.participantAuthUserIds.add(userId);
        }
        hangout.invitedAuthUserIds.remove(userId);
        hangout.updatedAt = Instant.now();
        hangoutRepository.update(hangout);
        return hangoutMapper.toResponse(hangout);
    }

    private HangoutModel findHangoutOrThrow(String authHangoutId) {
        return hangoutRepository.findByAuthHangoutId(parseObjectId(authHangoutId, "hangout"))
                .orElseThrow(() -> new HangoutNotFoundException(authHangoutId));
    }

    private void validateRequest(HangoutModelRequest request) {
        if (!request.endTime().isAfter(request.startTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        long distinctParticipants = request.participantAuthUserIds().stream().distinct().count();
        if (distinctParticipants != request.participantAuthUserIds().size()) {
            throw new BadRequestException("Participant ids must be unique");
        }
        if (request.invitedAuthUserIds() != null) {
            long distinctInvitees = request.invitedAuthUserIds().stream().distinct().count();
            if (distinctInvitees != request.invitedAuthUserIds().size()) {
                throw new BadRequestException("Invitee ids must be unique");
            }
            boolean overlap = request.invitedAuthUserIds().stream()
                    .anyMatch(request.participantAuthUserIds()::contains);
            if (overlap) {
                throw new BadRequestException("A user cannot be both a participant and an invitee");
            }
        }
    }

    private ObjectId parseObjectId(String id, String label) {
        if (!ObjectId.isValid(id)) {
            throw new BadRequestException("Invalid " + label + " id");
        }
        return new ObjectId(id);
    }

    private void ensureMembershipLists(HangoutModel hangout) {
        if (hangout.participantAuthUserIds == null) {
            hangout.participantAuthUserIds = new ArrayList<>();
        }
        if (hangout.invitedAuthUserIds == null) {
            hangout.invitedAuthUserIds = new ArrayList<>();
        }
    }
}
