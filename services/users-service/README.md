# users-service

### healthcheck

`curl http://localhost:8081/users/ping`

### create

```
curl -i -X POST http://localhost:8081/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Alex",
    "email": "alex@example.com",
    "password": "correct-horse-battery-staple",
    "role": "user",
    "avatarUrl": "https://example.com/avatar.png",
    "bio": "Coffee enthusiast"
  }'
```

### retrieve

`curl -i http://localhost:8081/users/me`

### update

```
curl -i -X PUT http://localhost:8081/users/me \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Alex M.",
    "email": "alex.m@example.com",
    "password": "correct-horse-battery-staple",
    "role": "user",
    "avatarUrl": "https://example.com/new-avatar.png",
    "bio": "Updated bio"
  }'
```

### delete

`curl -i -X DELETE http://localhost:8081/users/me`
