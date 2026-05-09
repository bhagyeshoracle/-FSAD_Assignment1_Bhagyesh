# API Documentation

Base URL (gateway): `http://localhost:4000/api`

Swagger UI:

- `http://localhost:4000/api-docs`
- Raw OpenAPI JSON: `http://localhost:4000/api-docs.json`
- Source OpenAPI file: `backend/docs/openapi.yaml`

## Auth Endpoints

### POST `/auth/register`

Registers a new student/staff account.

Request:

```json
{
  "name": "Alice",
  "email": "alice@school.edu",
  "password": "password123",
  "role": "student"
}
```

### POST `/auth/login`

Request:

```json
{
  "email": "student@school.edu",
  "password": "password123"
}
```

Response includes:

- `token`
- `user`

### GET `/auth/me`

Requires: `Authorization: Bearer <token>`

---

## Equipment Endpoints

### GET `/equipment`

Query parameters:

- `search` (optional)
- `category` (optional)
- `availableOnly=true|false` (optional)

### GET `/equipment/:id`

Fetch one equipment record.

### POST `/equipment` (admin only)

Body:

```json
{
  "name": "Tripod Stand",
  "category": "Photography",
  "equipment_condition": "Good",
  "description": "For media room use",
  "total_quantity": 6
}
```

### PUT `/equipment/:id` (admin only)

Updates equipment details and quantity.

### DELETE `/equipment/:id` (admin only)

Fails if active (`PENDING`/`APPROVED`) requests exist.

---

## Borrowing / Lending Endpoints

### POST `/requests`

Create a borrow request.

Body:

```json
{
  "equipmentId": 1,
  "quantity": 2,
  "startDate": "2026-05-10",
  "endDate": "2026-05-12",
  "remarks": "Lab demo"
}
```

Validates overlapping bookings and total quantity.

### GET `/requests/mine`

Returns logged-in user requests.

### GET `/requests` (staff/admin)

Optional query:

- `status=PENDING|APPROVED|REJECTED|RETURNED`

### PATCH `/requests/:id/approve` (staff/admin)

Approves pending request and reduces inventory availability.

### PATCH `/requests/:id/reject` (staff/admin)

Rejects pending request.

### PATCH `/requests/:id/return` (staff/admin)

Marks approved request as returned and restores inventory availability.

---

## Error Format

Common error payload:

```json
{
  "message": "Human readable message"
}
```
