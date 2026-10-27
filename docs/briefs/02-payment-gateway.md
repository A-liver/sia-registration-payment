# Brief 02: Payment gateway stub and PayPal client

Owner: [name]

## You own

`mocks/paypal-stub/`, `services/api/payment-gateway/`

## Starts after

The lead merges the first reference version of the payment stub (Phase 0). You extend and harden it.

## Tasks

1. Stub (port 4002) imitating the PayPal Orders v2 endpoints listed in `contracts/README.md`, including the token endpoint and `PayPal-Request-Id` handling (same id returns the same order).
2. Stub modes via `POST /admin/mode`: `success`, `declined`, `pending`, `slow` (delay longer than `PAYMENT_TIMEOUT_MS`), `failure` (5xx).
3. Gateway client in `services/api/payment-gateway/`: gets and caches an OAuth token, `createOrder`, `captureOrder`, `getOrder`. Plain `fetch`, no SDK. Converts integer minor units to PayPal decimal strings inside this folder only. Timeout from `PAYMENT_TIMEOUT_MS` on every call, throws `payment_timeout`.
4. Base URL comes from env: `PAYMENT_GATEWAY=stub` uses `PAYPAL_STUB_URL`, `PAYMENT_GATEWAY=paypal` uses `PAYPAL_BASE_URL` with the sandbox credentials. The client code must be identical in both cases.
5. Contract tests that run the client against the stub in every mode, and are written so they could run unchanged against the sandbox.
6. A short note in your PR on how to get sandbox credentials and run one real sandbox payment. Credentials go only in `.env`.

## Don't touch

`contracts/`, `db/`, `services/api/payments/` (lead).

## Done when

Client and stub pass the contract tests in all five modes, and one real sandbox payment succeeds when the lead's credentials are used.

## Report sections you can write

Technology 1 (REST), the stub and test double explanation in 2.2, the third-party dependency paragraph in 3.2.
