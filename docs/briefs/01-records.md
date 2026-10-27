# Brief 01: Legacy records and student verification

Owner: [name]

## You own

`mocks/legacy-records/`, `services/api/records/`, `load-tests/`

## Starts after

The lead merges the first reference version of the legacy records mock (Phase 0). You extend and harden it.

## Tasks

1. Legacy mock (port 4001) with its own MySQL database `sia_legacy`, schema and seed in `mocks/legacy-records/` (not in `db/`). Routes exactly as in `contracts/README.md`: student lookup, idempotent enrollment update, availability switch that returns 503 `legacy_unavailable` when off.
2. Student records client in `services/api/records/`: `findStudent`, `updateEnrollment`, timeout from `LEGACY_TIMEOUT_MS`, throws `legacy_unavailable` on timeout, network failure or 5xx.
3. IT-01 test: valid student can proceed, invalid student is denied with `invalid_student` and a clear message, through the gateway layer.
4. Test that the mock stays idempotent when the same enrollment update is sent twice.
5. Load test script for Deliverable 3 (k6 or a Node script in `load-tests/`): many concurrent registration requests, measure response time, throughput, error rate. Include a run against a slow gateway stub and a run with the legacy mock switched off.

## Don't touch

`contracts/`, `db/`, other members' folders.

## Done when

IT-01 passes, the client behaves correctly with the mock on, off and slow, and the load test runs and prints its numbers.

## Report sections you can write

IT-01 results, Deliverable 3.1 (bottleneck and load testing), the legacy compatibility paragraph in 3.2.
