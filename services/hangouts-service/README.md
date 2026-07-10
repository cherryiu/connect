# hangouts-service

### healthcheck

`curl http://localhost:8082/hangouts/507f1f77bcf86cd799439011/ping`

### create

```
curl -i -X POST "http://localhost:8082/hangouts/507f1f77bcf86cd799439011/create" \
  -H "Content-Type: application/json" \
  -d '{
    "participantAuthUserIds": ["507f1f77bcf86cd799439012" "507f1f77bcf86cd799439013"],
    "hangoutName": "Coffee catch-up",
    "location": "Downtown",
    "startTime": "2026-06-01T18:00:00Z",
    "endTime": "2026-06-01T19:00:00Z",
    "description": "Bring a laptop",
    "isOpen": true
  }'
```
