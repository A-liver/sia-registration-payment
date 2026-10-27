# Architecture

Implements the design in `docs/Midterm_Exam_SIA.pdf` as a small runnable system. The portal and the API run as one Express app. The legacy student records system and the payment provider are separate processes, so every integration happens over real HTTP.

## Processes and ports

| Process                              | Folder                     | Port |
| ------------------------------------ | -------------------------- | ---- |
| Portal and API                       | `portal/`, `services/api/` | 3000 |
| Legacy student records mock          | `mocks/legacy-records/`    | 4001 |
| Payment gateway stub (PayPal-shaped) | `mocks/paypal-stub/`       | 4002 |
| MySQL                                | local                      | 3306 |

## Modules, owners and report mapping

| Module                                | Folder                                                                                        | Owner    | Report component                                  | Tests                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------- | ---------------------- |
| Foundation, auth, payment integration | `contracts/`, `db/`, `services/api/server.js`, `services/api/auth/`, `services/api/payments/` | Lead     | Payment Integration System                        | IT-03 (first half)     |
| Legacy records mock and adapter       | `mocks/legacy-records/`, `services/api/records/`, `load-tests/`                               | Member 2 | Legacy Student Records System, adapter            | IT-01, load test       |
| Payment gateway stub and client       | `mocks/paypal-stub/`, `services/api/payment-gateway/`                                         | Member 3 | Payment Gateway (and stub)                        | gateway contract tests |
| Registration, catalog, gateway layer  | `services/api/registration/`, `services/api/catalog/`, `services/api/gateway/`                | Member 4 | Registration Service, Course Catalog, API Gateway | IT-02                  |
| Recovery and reconciliation           | `services/api/recovery/`                                                                      | Member 5 | Recovery and Reconciliation group                 | IT-03 (second half)    |
| Portal UI                             | `portal/`                                                                                     | Member 6 | Student Web Portal                                | UI checks              |

## How modules plug in

Each module under `services/api/` exports an Express router from its `index.js`. The lead mounts routers in `services/api/server.js`. Modules call each other only through the clients and services named in `contracts/README.md`, never by reaching into another module's files.

## Main flow

1. Student signs in, picks a course. The Registration Service checks the student with the Student Records client and the course with the Catalog (slots, prerequisites) and reserves a slot in a transaction.
2. Student pays. Payment Integration creates an order with the payment gateway client using an idempotency key.
3. Student approves the payment on PayPal. Payment Integration captures the order, then fetches it from the provider to verify it. The confirmed payment reference is stored once.
4. Payment Integration asks the Student Records client to update the enrollment. On success the enrollment is `enrolled` and the student is notified.
5. If the legacy system is unavailable, the update goes to the recovery queue as `pending` with the original payment reference. The retry worker reuses that reference. After the retry limit the case becomes `needs_review` for staff reconciliation. No retry ever creates a new payment.

## Environments

- `PAYMENT_GATEWAY=stub` points the gateway client at the stub on port 4002. This is the default for development, tests and load tests.
- `PAYMENT_GATEWAY=paypal` points the same client at the PayPal sandbox. Used for a few end-to-end checks.
- The client code is identical in both cases. Only the base URL and credentials differ.

## Reference pattern: copy `mocks/legacy-records/`

The legacy records mock is the pattern every module follows, and `mocks/paypal-stub/` follows the same layers (routes, services, middleware, in-memory state instead of SQL). Read them before writing yours.

| File                                    | Role                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `server.js`                             | Starts the app: creates the pool, builds repositories, listens on a port    |
| `app.js`                                | `createApp({...})` receives everything it needs, so tests can pass fakes    |
| `routes/`                               | HTTP only: read the request, call a service, send the response              |
| `services/`                             | Business rules, no Express objects, throw `AppError(status, code, message)` |
| `repositories/`                         | SQL only, parameterized queries                                             |
| `errors.js`, `validation.js`            | One error type and small input checks                                       |
| `schema.sql`, `seed.sql`, `db-setup.js` | Tables, demo data, and a safe re-runnable setup                             |
| `app.test.js`                           | Fast tests with fake repositories, run in CI without a database             |
| `repositories.integration.test.js`      | Tests against a real database, run with `npm run test:db`                   |

Rules the pattern shows: validate at the edge, standard error shape from `contracts/statuses.js`, dependencies passed in, idempotent writes enforced by a UNIQUE key and handled by catching the duplicate error, and database outages reported as `legacy_unavailable` instead of a crash.
