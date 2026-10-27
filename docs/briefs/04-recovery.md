# Brief 04: Recovery and reconciliation

Owner: [name]

## You own

`services/api/recovery/`

## Tasks

1. Queue functions: `enqueueUpdate`, list pending, mark done, mark `needs_review`. Each item stores the original payment reference, the student and course, an attempt count and a status from `RECOVERY_STATUS`. Table design comes from the lead's schema.
2. Retry worker: loops on an interval, takes `pending` items, calls the records client `updateEnrollment` with the stored reference only, never touching the payment gateway. On success marks `done`, updates the enrollment to `enrolled` and creates a student notification. After `RETRY_LIMIT` failures marks `needs_review`. Use backoff between attempts.
3. Staff routes (staff role only): list pending and `needs_review` items, retry now, and resolve with a required note.
4. IT-03 second half tests: legacy off then back on, retry succeeds, exactly one payment record, no second order created; retry limit reached leads to `needs_review`. Use the legacy mock availability switch.
5. A test that two workers or a double click on "retry now" cannot apply the same update twice.

## Don't touch

`contracts/`, `db/`, `services/api/payments/`, other members' folders.

## Done when

The recovery path in Figure 3 works end to end with the mocks, and the tests prove it never charges again.

## Report sections you can write

Application Co-operation Middleware paragraph, the recovery workflow explanation for Figure 3, the legacy compatibility and recovery paragraph in 3.2.
