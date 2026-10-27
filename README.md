# University Registration and Online Payment System

SIA midterm project. Students register for courses and pay tuition through PayPal (sandbox only). This is a student project, not the official RMMC portal.

## What you need

- Node.js 24 (`nvm install 24` then `nvm use`, or install from nodejs.org)
- MySQL 8 or MariaDB (XAMPP works)
- Git

## Quick start

```bash
git clone <repo-url>
cd sia-registration-payment
npm install
cp .env.example .env      # on Windows PowerShell: Copy-Item .env.example .env
```

Open `.env` and fill in your MySQL user and password. Leave `PAYMENT_GATEWAY=stub` unless you are testing PayPal.

Create the legacy records database (needs MySQL running):

```bash
npm run db:setup:legacy    # safe to run again; add "-- --reset" to wipe and reseed
```

```bash
npm run dev     # starts the API (3000), legacy mock (4001), payment stub (4002)
```

The legacy mock and the payment stub are built. The main API (`services/api/server.js`) is not yet, so `npm run dev:api` fails until it is added.

Try the payment stub: `npm run dev:paypal-stub`, then open `http://localhost:4002/health`.

## Checks

```bash
npm run lint
npm run format:check
npm test            # fast tests, no database needed
npm run test:db     # also tests against your local MySQL (uses database sia_legacy_test)
```

## PayPal sandbox (only when testing the real gateway)

1. Sign in at developer.paypal.com with a PayPal account.
2. Under Apps and Credentials, switch to Sandbox and create an app.
3. Copy the Client ID and Secret into your own `.env`, set `PAYMENT_GATEWAY=paypal`.
4. Pay with the sandbox buyer account PayPal lists under Sandbox accounts. No real money moves.

Never commit `.env`.

## Where things are

- Rules for people and for Claude: `CLAUDE.md`, `CONTRIBUTING.md`
- Architecture and ports: `docs/ARCHITECTURE.md`
- Task briefs per member: `docs/briefs/`
- Shared shapes and statuses: `contracts/`
- Design direction: `docs/DESIGN.md`
