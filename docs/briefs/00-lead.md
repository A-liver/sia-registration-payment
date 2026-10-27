# Brief 00: Lead

Owner: [name]

## You own

`contracts/`, `db/`, `services/api/server.js`, `services/api/auth/`, `services/api/payments/`, repo settings and all reviews.

## Phase 0 (before anyone else starts, target: first working session)

1. Confirm or fix the draft in `contracts/README.md`. Members code against it, so settle it first.
2. Write `db/schema.sql` and `db/seed.sql` for the main database (students are not stored here, they live in the legacy system). Tables to cover: courses, prerequisites, registrations, payments (UNIQUE payment reference and idempotency key), recovery queue, notifications. Seed data is labeled demo data.
3. Write `services/api/server.js`: Express app, static `portal/`, mounts each module's router from `services/api/<module>/index.js`.
4. Build the reference slices with Claude, which every member copies: the first version of the legacy records mock and the PayPal-shaped payment stub, each with one route, one service, one test.
5. Set up the repo: protected `main`, collaborators, `CODEOWNERS`, project board, one issue per task from the briefs.

## Phase 1 (while others work in parallel)

- Simple demo sign-in (`services/api/auth/`): demo student and staff accounts, session cookie, role check for the reconciliation routes.
- Payment Integration (`services/api/payments/`): create order with an idempotency key, capture, verify through the gateway client, store the confirmed reference once, then request the enrollment update. On a legacy failure, call the recovery queue and set the enrollment to `payment_confirmed_update_pending`.
- Review pull requests against the checklist in `CONTRIBUTING.md`.

## Phase 2

- Wire the modules together, fix integration gaps, run the full end-to-end flow with the stub, then a few runs against the PayPal sandbox.
- Run the antislop Delivery Gate on the whole portal.
- Collect results for the report: test outcomes, load test numbers, screenshots.

## Done when

IT-03 passes end to end with the stub and with the sandbox, `main` is green, and every module is merged.

## If time gets tight

Hand `services/api/payments/` to Member 3 and keep contracts, review and integration.
