# Coze: An open invitation app for comfortable catch ups

### techstack

| Feature    | Tool                  |
| ---------- | --------------------- |
| Frontend   | React                 |
| Backend    | Quarkus microservices |
| Database   | MongoDB               |
| Messaging  | ActiveMQ Artemis      |
| Maps       | Google Maps or Mapbox |
| Deployment | Docker Compose        |

### refs

| Service               | Port |
| --------------------- | ---- |
| api-gateway           | 8080 |
| user-friend-service   | 8081 |
| hangouts-service      | 8082 |
| location-service      | 8083 |
| visit-journal-service | 8084 |
| notification-service  | 8085 |

### tests

make sure to rebuild with `docker compose up --build` when testing lol <br/>

use `http://localhost:8080/q/swagger-ui`

#### test create 2 users

curl -i -X POST "http://localhost:8080/api/users/507f1f77bcf86cd799439011/create" \
 -H "Content-Type: application/json" \
 -d '{
"displayName": "Alex",
"email": "alex@example.com",
"avatarUrl": "https://example.com/avatar.png",
"bio": "Coffee enthusiast"
}'

curl -i -X POST "http://localhost:8080/api/users/507f1f77bcf86cd799439012/create" \
 -H "Content-Type: application/json" \
 -d '{
"displayName": "Jenny",
"email": "jenny@example.com",
"avatarUrl": "https://example.com/avatar2.png",
"bio": "Loves plants!"
}'

curl -i -X GET "http://localhost:8080/api/users/507f1f77bcf86cd799439012/retrieve"

curl -v -i -X POST "http://localhost:8080/api/hangouts/507f1f77bcf86cd799439013/create" \
 -H "Content-Type: application/json" \
 -d '{
"participantAuthUserIds": ["507f1f77bcf86cd799439011" "507f1f77bcf86cd799439012"],
"hangoutName": "Coffee catch-up",
"location": "Downtown",
"startTime": "2026-06-01T18:00:00Z",
"endTime": "2026-06-01T19:00:00Z",
"description": "Bring a laptop",
"isOpen": true
}'

curl http://localhost:8080/api/hangouts/507f1f77bcf86cd799439011/ping
