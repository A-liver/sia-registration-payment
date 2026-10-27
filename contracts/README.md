# Contracts (draft v0)

Owned by the lead. Members code against these shapes. If a shape is wrong or missing, open a Task issue. Do not edit this folder yourself.

Statuses and error codes live in `statuses.js`. Use them instead of typing strings.

## Legacy records mock (HTTP, port 4001)

Built and tested. Errors always use `{ "error": { "code": "...", "message": "..." } }`.

`GET /students/:studentId`

- 200: `{ "studentId": "DEMO-1001", "fullName": "Demo Student One", "status": "active" }` where `status` is `active` or `inactive`
- 404 `not_found` when the student does not exist
- 400 `validation_error` when the ID is malformed (1 to 32 letters, digits or dashes)

`POST /enrollments` with body `{ "studentId": "...", "courseId": "...", "paymentReference": "..." }`

- 201: `{ "enrollmentId": "ENR-000001", "status": "enrolled" }`
- 200 with the same body again: the same result, no duplicate row (idempotent on studentId, courseId, paymentReference)
- 404 `not_found` for an unknown student, 422 `invalid_student` for an inactive student
- 400 `validation_error` for a missing or malformed field, or a body that is not a JSON object

`GET /health` returns `{ "status": "ok", "available": true }` and keeps answering while the mock is switched off.

`GET /admin/availability` returns `{ "available": true }`. `POST /admin/availability` with `{ "available": false }` returns `{ "available": false }` (mock only, test switch).

While unavailable, `/students` and `/enrollments` return 503 `legacy_unavailable`. The same 503 is returned when the mock cannot reach its database. Any other unexpected failure returns 500 `internal_error`.

## Student records client (JavaScript, `services/api/records/`)

- `findStudent(studentId)` returns `{ studentId, fullName, status }` or `null` when not found
- `updateEnrollment({ studentId, courseId, paymentReference })` returns `{ enrollmentId, status }`
- Both throw an error with `code: 'legacy_unavailable'` on timeout, network failure or a 5xx response

## Payment gateway stub (HTTP, port 4002)

Built and tested. It imitates the parts of the PayPal Orders v2 API this project uses, with PayPal's own status names and error shapes, so one client works against the stub and the sandbox. Only the base URL and credentials change. Modeled on PayPal's published Orders v2 documentation. Member 3 must confirm the shapes against a real sandbox run.

All `/v2` routes need `Authorization: Bearer <token>`. A missing, unknown or expired token returns 401 `AUTHENTICATION_FAILURE`.

- `POST /v1/oauth2/token` with `Authorization: Basic <id:secret>` and form body `grant_type=client_credentials` returns `{ "access_token", "token_type": "Bearer", "expires_in" }`. Missing credentials return 401 `{ "error": "invalid_client" }`. The stub accepts any non-empty id and secret.
- `POST /v2/checkout/orders` with `{ "intent": "CAPTURE", "purchase_units": [{ "reference_id": "...", "amount": { "currency_code": "USD", "value": "25.00" } }] }` returns 201 with `{ "id", "status": "CREATED", "purchase_units", "links" }`. The `links` include `rel: "approve"`. Bad input returns 400 `INVALID_REQUEST` with `details[].field` and `details[].issue`.
- `GET /v2/checkout/orders/:id` returns the order. Unknown id returns 404 `RESOURCE_NOT_FOUND`.
- `POST /v2/checkout/orders/:id/capture` returns 201 with `status: "COMPLETED"` and `purchase_units[0].payments.captures[0]` holding `id`, `status` and `amount`.
  - Before the buyer approves: 422 `UNPROCESSABLE_ENTITY` with `details[0].issue: "ORDER_NOT_APPROVED"`.
  - Second capture with a different request id: 422 `ORDER_ALREADY_CAPTURED`.
  - Declined card (mode `declined`): 422 `INSTRUMENT_DECLINED`, nothing is captured, and the buyer can try again.
- `PayPal-Request-Id` header on a POST: the first successful response is saved. Sending the same id again returns that response with status 200 and does nothing new. This is how retries stay safe.
- Order `status` values used: `CREATED`, `APPROVED`, `COMPLETED`. Capture `status` values used: `COMPLETED`, `PENDING` (with `status_details.reason: "PENDING_REVIEW"`), `DECLINED`.

Stub-only controls (not in real PayPal):

- `GET /health` returns `{ "status": "ok", "mode", "delayMs" }`
- `GET /admin/mode` and `POST /admin/mode` with `{ "mode": "success" | "declined" | "pending" | "slow" | "failure", "delayMs": 8000 }`
  - `pending`: capture succeeds with a `PENDING` capture. Later `POST /admin/orders/:id/resolve` with `{ "outcome": "completed" | "declined" }` settles it.
  - `slow`: order routes wait `delayMs` (default 8000, longer than `PAYMENT_TIMEOUT_MS`), then carry on as normal. If the caller already timed out, the payment is still captured. The client must look the order up with `GET` before doing anything else.
  - `failure`: order routes return 503 `SERVICE_UNAVAILABLE`. The token route and admin routes keep working.
- `POST /admin/orders/:id/approve` simulates the buyer approving
- `GET /admin/orders` lists all orders (handy for asserting "exactly one capture")
- `POST /admin/expire-tokens` invalidates every token, to test token refresh
- `POST /admin/reset` clears orders, tokens and saved responses and returns to `success` mode
- `GET /checkoutnow?token=<orderId>` is a small approval page with Approve and Cancel buttons, so the whole flow runs without internet. It is labeled as a stub, not PayPal.

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
