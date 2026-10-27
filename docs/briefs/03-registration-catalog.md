# Brief 03: Registration, catalog and gateway layer

Owner: [name]

## You own

`services/api/registration/`, `services/api/catalog/`, `services/api/gateway/`

## Tasks

1. Catalog routes: list courses with slots left and prerequisites, get one course. Read from the main database seeded by the lead.
2. Registration service: check the student with the records client (use a simple fake of its two functions in your tests until the real one is merged), check prerequisites, reserve a slot inside a transaction (`SELECT ... FOR UPDATE`) so a full course cannot oversell, and return the result with the standard error codes (`invalid_student`, `prerequisite_not_met`, `course_full`) and a plain explanation.
3. Gateway layer middleware in `services/api/gateway/`: request id, request logging (service, action, outcome, duration), a central error handler that returns the standard error shape and never a stack trace, and a request timeout.
4. IT-02 test: an eligible request proceeds, a request with unmet prerequisites or a full course is rejected with a clear explanation.
5. Test two simultaneous registrations for the last slot: exactly one succeeds.

## Don't touch

`contracts/`, `db/`, other members' folders. If you need a new column, open a Task issue.

## Done when

IT-02 passes, the last-slot test passes, and the error shape matches the contract everywhere.

## Report sections you can write

IT-02 results, the Distribution Middleware paragraph (API Gateway routing), the system management middleware paragraph (logs and error handling).
