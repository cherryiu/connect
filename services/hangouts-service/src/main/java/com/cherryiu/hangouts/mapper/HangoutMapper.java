package com.cherryiu.hangouts.mapper;

import com.cherryiu.hangouts.dto.HangoutModelRequest;
import com.cherryiu.hangouts.dto.HangoutModelResponse;
import com.cherryiu.hangouts.model.HangoutModel;
import jakarta.enterprise.context.ApplicationScoped;
import org.bson.types.ObjectId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class HangoutMapper {

    public HangoutModelResponse toResponse(HangoutModel model) {
        return new HangoutModelResponse(
                model.id.toString(),
                model.authHangoutId.toString(),
                toStringIdList(model.participantAuthUserIds),
                model.hangoutName,
                model.location,
                toInstant(model.startTime),
                toInstant(model.endTime),
                model.description,
                model.isOpen,
                model.createdAt,
                model.updatedAt
        );
    }

    public void applyRequest(HangoutModel model, HangoutModelRequest request) {
        model.participantAuthUserIds = toObjectIdList(request.participantAuthUserIds());
        model.hangoutName = request.hangoutName();
        model.location = request.location();
        model.startTime = toDate(request.startTime());
        model.endTime = toDate(request.endTime());
        model.description = request.description();
        model.isOpen = request.isOpen();
        model.updatedAt = Instant.now();
    }

    public HangoutModel toNewEntity(ObjectId authHangoutId, HangoutModelRequest request) {
        HangoutModel model = new HangoutModel();
        model.authHangoutId = authHangoutId;
        model.createdAt = Instant.now();
        applyRequest(model, request);
        return model;
    }

    private List<String> toStringIdList(ArrayList<ObjectId> ids) {
        if (ids == null) {
            return List.of();
        }
        return ids.stream().map(ObjectId::toString).toList();
    }

    private ArrayList<ObjectId> toObjectIdList(List<String> ids) {
        ArrayList<ObjectId> result = new ArrayList<>();
        if (ids != null) {
            for (String id : ids) {
                result.add(new ObjectId(id));
            }
        }
        return result;
    }

    private Instant toInstant(Date date) {
        return date == null ? null : date.toInstant();
    }

    private Date toDate(Instant instant) {
        return instant == null ? null : Date.from(instant);
    }
}
