# CLAUDE.md

Rules for every Claude chat or session working on this repository. Read this file first, then `docs/ARCHITECTURE.md`, `contracts/README.md` and your brief in `docs/briefs/`. If you are a student pasting this into claude.ai, tell Claude which brief is yours.

## Project

University Registration and Online Payment System for an SIA midterm. Students register for courses and pay tuition through PayPal (sandbox only). The system connects a portal, an API gateway layer, a Registration Service, a Course Catalog, a Payment Integration System, a legacy student records system (mocked) and a payment gateway (stub or PayPal sandbox). The source design is `docs/Midterm_Exam_SIA.pdf`. This is a student project, not a deployed university system. Never present it as the official RMMC portal.

## Stack (fixed, do not change)

- JavaScript only, ES modules (`import` and `export`). No TypeScript, no CommonJS (`require`).
- Node.js 24 (see `.nvmrc`), Express for HTTP, `mysql2` for MySQL. Use built-in `fetch` for outbound HTTP.
- Portal: plain HTML, CSS and vanilla JavaScript in `portal/`. No frameworks, no build step.
- Tests: Node's built-in runner (`node:test`, `node:assert/strict`). Files end in `.test.js`.
- Formatting and linting: Prettier and ESLint. Run `npm run lint`, `npm run format:check` and `npm test` before every push.
- Do not add a dependency. If you think one is needed, stop and ask the student to open an issue for the lead.

## Who edits what

Each member owns one module folder (see the brief). Only edit files inside your module and its tests.

Lead-only files: `contracts/`, `db/`, `package.json`, `package-lock.json`, `.github/`, `CLAUDE.md`, `docs/DESIGN.md`. If your task needs a change there (a new field, a new column, a new status), stop. Do not edit it yourself. Tell the student to open a Task issue describing the change and wait for the lead.

Never rewrite or reformat files outside your module. Never write scripts that patch other files in the repository.

## Folder map and ports

- `portal/` static pages, served by `services/api` at `http://localhost:3000`
- `services/api/` gateway layer, registration, catalog, payments, recovery (port 3000)
- `mocks/legacy-records/` legacy student records mock (port 4001)
- `mocks/paypal-stub/` payment gateway stub that imitates PayPal (port 4002)
- `contracts/` shared shapes, statuses, error codes and contract tests
- `db/` MySQL schema and seed data

## Code conventions

- Layers inside a service folder: `routes/` (HTTP only: parse request, call a service, send response), `services/` (business logic, no Express objects), `clients/` (outbound calls to other services), `repositories/` (SQL only).
- Names: camelCase in JavaScript and JSON, snake_case in MySQL, kebab-case for file names.
- Money: integer minor units (centavos or cents) everywhere inside the system. Convert to PayPal's decimal string only inside the PayPal gateway file.
- Time: ISO 8601 in UTC.
- Error responses always look like `{ "error": { "code": "course_full", "message": "No slots left for this course." } }`. Codes come from `contracts/statuses.js`. Never invent a code or status string in your module.
- Use the status values and error codes from `contracts/statuses.js`. Never type them as raw strings.
- SQL: parameterized queries only (`?` placeholders). Never build SQL by joining strings with user input.
- Validate every request body and parameter at the route. Reject with `validation_error` and a clear message.
- Comments explain why, not what. No leftover debug `console.log`.

## Reliability rules (from the report, these are graded)

- Every outbound call has a timeout (`AbortSignal.timeout(ms)` with the value from `.env`). A slow provider must never leave a request hanging.
- A payment is never created twice for the same registration. Creating an order uses an idempotency key. The confirmed payment reference is stored once, enforced by a UNIQUE column.
- A payment is only counted after the provider's API confirms it (fetch the order or capture from the provider). A webhook alone is never proof of payment.
- If the legacy records system is down after a confirmed payment, record the update as `pending` in the recovery queue with the original payment reference. Retry reuses that reference and never creates another payment. After the retry limit, mark `needs_review` for staff.
- Reserve course slots inside a database transaction so a full course cannot oversell.
- Log each cross-service call (service, action, outcome, duration). Never log secrets or full card data.

## Security rules

- Secrets live only in `.env`, which is never committed. `.env.example` holds names and safe defaults, never real values.
- Sandbox only. No real card data is ever handled, stored or typed into this project.
- Do not return stack traces to the client.

## UI rules

For anything in `portal/`, follow `docs/DESIGN.md` and `docs/antislop.md`. In short:

- Light theme, Poppins with the fallback stack, colors from the tokens in DESIGN.md as CSS variables. No colors outside the palette.
- Only build navigation items for pages that exist. Every button must work.
- Every screen that shows data has loading, empty and error states. Payment screens have separate states for processing, paid, declined, cancelled, pending and failed.
- Status chips always show an icon and a text label, never color alone.
- Sandbox notice on every payment screen. No claims like "secure" or "encrypted".
- Copy is plain and specific. No em dashes in any text shown to users. No invented statistics, testimonials or FAQ.
- Seeded students, courses and fees are demo data and must be labeled as such on screen.
- Before handing UI work to the student, run the Delivery Gate from antislop.md and give the PASS or FAIL report. Test at phone width and with the keyboard.

## How to work with the student

- Read your brief and the contract before writing code. Ask one clear question if something is missing; do not guess at contracts.
- Make the smallest change that completes the task. One task per branch and per pull request.
- Give complete files for new files. For edits to existing files, show the exact change and where it goes.
- Explain what the code does in plain language so the student can defend it. The student must understand every line they submit.
- Write tests with the code. A feature without a test is not done.
- Be honest about anything you could not run or verify.

## Git rules

- Never work on `main`. Branch names: `feature/<module>-<short-task>`, for example `feature/records-student-lookup`.
- Commit messages: `<module>: <what changed>`, for example `records: add student lookup route`.
- Open a pull request against `main` and fill in the template. The lead reviews and merges.

## Definition of done

1. The behavior in the brief works when run locally.
2. Tests for it exist and `npm test` passes.
3. `npm run lint` and `npm run format:check` pass.
4. No files changed outside the module, or the exceptions are listed in the PR.
5. No secrets, no debug output, no fake data presented as real.
6. For UI: DESIGN.md and the antislop Delivery Gate satisfied, screenshots attached.
