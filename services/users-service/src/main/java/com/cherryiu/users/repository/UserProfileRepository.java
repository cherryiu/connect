package com.cherryiu.users.repository;

import com.cherryiu.users.model.UserProfile;

import com.mongodb.client.model.Filters;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@ApplicationScoped
public class UserProfileRepository implements PanacheMongoRepository<UserProfile> {

    public Optional<UserProfile> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    /**
     * Finds a small set of people by name or email while excluding users who are
     * already connected. Quoting the input makes it literal text, not a regex.
     */
    public List<UserProfile> search(String query, Collection<ObjectId> excludedIds) {
        Pattern searchText = Pattern.compile(Pattern.quote(query), Pattern.CASE_INSENSITIVE);
        Bson matchesNameOrEmail = Filters.or(
                Filters.regex("displayName", searchText),
                Filters.regex("email", searchText)
        );
        Bson isNotConnected = Filters.nin("_id", excludedIds);

        return mongoCollection()
                .find(Filters.and(matchesNameOrEmail, isNotConnected))
                .limit(20)
                .into(new ArrayList<>());
    }
}
