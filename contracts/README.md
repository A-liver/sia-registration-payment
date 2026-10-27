# Contracts (draft v0)

Owned by the lead. Members code against these shapes. If a shape is wrong or missing, open a Task issue. Do not edit this folder yourself.

Statuses and error codes live in `statuses.js`. Use them instead of typing strings.

## Legacy records mock (HTTP, port 4001)

`GET /students/:studentId`

- 200: `{ "studentId": "2411600058", "fullName": "Demo Student", "status": "active" }` where `status` is `active` or `inactive`
- 404: `{ "error": { "code": "not_found", "message": "..." } }`

`POST /enrollments` with body `{ "studentId": "...", "courseId": "...", "paymentReference": "..." }`

- 201: `{ "enrollmentId": "...", "status": "enrolled" }`
- 200 with the same body: the same result, no duplicate row (idempotent on studentId, courseId, paymentReference)
- 503 while unavailable: `{ "error": { "code": "legacy_unavailable", "message": "..." } }`

`POST /admin/availability` with body `{ "available": false }` (mock only, test switch)

- 200: `{ "available": false }`

## Student records client (JavaScript, `services/api/records/`)

- `findStudent(studentId)` returns `{ studentId, fullName, status }` or `null` when not found
- `updateEnrollment({ studentId, courseId, paymentReference })` returns `{ enrollmentId, status }`
- Both throw an error with `code: 'legacy_unavailable'` on timeout, network failure or a 5xx response

## Payment gateway stub (HTTP, port 4002)

The stub imitates the parts of the PayPal Orders v2 API this project uses, so the real client works against both.

- `POST /v1/oauth2/token` returns `{ "access_token": "...", "token_type": "Bearer", "expires_in": 3600 }`
- `POST /v2/checkout/orders` (header `PayPal-Request-Id`) returns `{ "id": "...", "status": "CREATED", "links": [{ "rel": "approve", "href": "..." }] }`
- `POST /v2/checkout/orders/:id/capture` returns the order with `status` and `purchase_units[0].payments.captures[0].id`
- `GET /v2/checkout/orders/:id` returns the same order shape
- Repeating a create call with the same `PayPal-Request-Id` returns the same order
- `POST /admin/mode` with `{ "mode": "success" | "declined" | "pending" | "slow" | "failure" }` (stub only)

## Payment gateway client (JavaScript, `services/api/payment-gateway/`)

All amounts are integer minor units. The client converts to PayPal's decimal strings internally.

- `createOrder({ amountMinor, currency, referenceId, idempotencyKey })` returns `{ orderId, status, approvalUrl }`
- `captureOrder({ orderId, idempotencyKey })` returns `{ orderId, captureId, status }`
- `getOrder(orderId)` returns `{ orderId, captureId, status, amountMinor, currency }` and is the verification step
- `status` is one of `PAYMENT_STATUS`. A declined card returns `declined`. A timeout or network failure throws an error with `code: 'payment_timeout'`.

## Recovery queue (JavaScript, `services/api/recovery/`)

- `enqueueUpdate({ studentId, courseId, paymentReference })` creates a `pending` item
- Each item stores the original payment reference, an attempt count and a status from `RECOVERY_STATUS`
- The worker retries `updateEnrollment` with the stored reference only, never a new payment, up to `RETRY_LIMIT`, then sets `needs_review`

## Enrollment and payment statuses

See `statuses.js`: `PAYMENT_STATUS`, `ENROLLMENT_STATUS`, `RECOVERY_STATUS`.
