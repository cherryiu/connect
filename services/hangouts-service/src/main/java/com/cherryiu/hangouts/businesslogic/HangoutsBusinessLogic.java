package com.cherryiu.hangouts.businesslogic;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.bson.types.ObjectId;

import com.cherryiu.hangouts.dto.HangoutModelRequest;
import com.cherryiu.hangouts.dto.HangoutModelResponse;
import com.cherryiu.hangouts.exception.HangoutNotFoundException;
import com.cherryiu.hangouts.mapper.HangoutMapper;
import com.cherryiu.hangouts.model.HangoutModel;

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
        return hangoutRepository.findByParticipantAuthUserId(new ObjectId(authUserId))
                .stream()
                .map(hangoutMapper::toResponse)
                .toList();
    }

    public HangoutModelResponse createHangout(String authHangoutId, HangoutModelRequest request) {
        HangoutModel hangout = hangoutMapper.toNewEntity(new ObjectId(authHangoutId), request);
        hangoutRepository.persist(hangout);
        return hangoutMapper.toResponse(hangout);
    }

    public HangoutModelResponse updateHangout(String authHangoutId, HangoutModelRequest request) {
        HangoutModel hangout = findHangoutOrThrow(authHangoutId);
        hangoutMapper.applyRequest(hangout, request);
        hangoutRepository.update(hangout);
        return hangoutMapper.toResponse(hangout);
    }

    public void deleteHangout(String authHangoutId) {
        HangoutModel hangout = findHangoutOrThrow(authHangoutId);
        hangoutRepository.delete(hangout);
    }

    private HangoutModel findHangoutOrThrow(String authHangoutId) {
        return hangoutRepository.findByAuthHangoutId(new ObjectId(authHangoutId))
                .orElseThrow(() -> new HangoutNotFoundException(authHangoutId));
    }
}
