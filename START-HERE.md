# Start here

Read this first. It takes you from zero to your first pull request. Do the steps in order and ask the lead when something does not match.

## 1. What we are building

A University Registration and Online Payment System. A student signs in, registers for a course, pays tuition through PayPal (sandbox, no real money), and gets enrolled in the legacy student records system. If the legacy system is down after the payment, the enrollment waits in a queue and is retried safely. Nobody is ever charged twice.

```
Student portal -> API layer -> Registration + Catalog -> Payment Integration
                                                            |-> PayPal (stub or sandbox)
                                                            |-> Legacy records (mock)
                                              Recovery queue <- retries if legacy is down
```

Two things are already built and tested, and you should copy their style:

- `mocks/legacy-records/` is the legacy student records mock.
- `mocks/paypal-stub/` is a local imitation of PayPal.

## 2. Install (once)

1. Git, Node.js 24 (LTS), VS Code, and XAMPP (for MySQL).
2. Check in PowerShell:

```powershell
git --version
node -v      # must say v24.x
npm -v
```

3. Accept the GitHub invitation sent to your email.

## 3. Get the project

Do not use a folder inside OneDrive. Use `C:\dev`.

```powershell
mkdir C:\dev
cd C:\dev
git clone https://github.com/<lead-username>/sia-registration-payment.git
cd sia-registration-payment
npm install
Copy-Item .env.example .env
code .
```

Open `.env` and check the MySQL lines. With XAMPP the defaults usually work (`DB_USER=root`, empty password). Never commit `.env`.

Always run commands in the project folder. If you see `Could not read package.json`, you are in the wrong folder.

## 4. Check that everything works

```powershell
npm run lint
npm run format:check
npm test
```

All three must pass. If format check fails, run `npm run format` and try again.

## 5. Run the two mocks and look at them

1. Start MySQL in the XAMPP Control Panel.
2. Terminal 1:

```powershell
npm run db:setup:legacy
npm run dev:legacy
```

Open `http://localhost:4001/students/DEMO-1001` in your browser. You should see a demo student.

3. Terminal 2:

```powershell
npm run dev:paypal-stub
```

Open `http://localhost:4002/health`. You should see `"status":"ok"`.

`npm run dev` will not work yet, because the main API is not built. Start the mocks one by one as above.

4. Try writing data (Terminal 3):

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4001/enrollments -ContentType 'application/json' -Body '{"studentId":"DEMO-1001","courseId":"CS101","paymentReference":"PAY-TEST-1"}'
```

Run it twice. The second result is the same enrollment, not a duplicate. That is called idempotent, and the whole payment design depends on it.

Now switch the legacy system off and on:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4001/admin/availability -ContentType 'application/json' -Body '{"available":false}'
Invoke-RestMethod -Method Get -Uri http://localhost:4001/students/DEMO-1001
```

The second call fails with `legacy_unavailable`. This is the failure the recovery workflow handles. Switch it back with `{"available":true}`.

## 6. Set up your Claude Project

Everyone uses the same rules so the code looks the same.

1. In claude.ai create a Project called `SIA Registration Payment`.
2. Upload these files: `CLAUDE.md`, `docs/DESIGN.md`, `docs/antislop.md`, `docs/ARCHITECTURE.md`, `contracts/README.md`, `docs/Midterm_Exam_SIA.pdf`, and your own brief from `docs/briefs/`.
3. In the Project instructions write: `Follow CLAUDE.md in the project files before answering. My task is in the brief I uploaded.`

Start the first chat with this prompt:

```
Read CLAUDE.md, ARCHITECTURE.md, contracts/README.md and my brief. Summarize my task
in 5 bullets, list what you need from me, and ask your questions. Do not write code yet.
```

Then build one task at a time:

```
Build task 1 from my brief. Follow the reference pattern in mocks/legacy-records.
Give me complete new files and exact edits for existing ones. Write the tests too.
Then explain each file in plain language so I can defend it.
```

Before you ask Claude to edit a file, paste the current version into the chat. Never let it work from memory of an old copy.

## 7. Who owns what

| Member   | Brief                        | Your folders                                                        |
| -------- | ---------------------------- | ------------------------------------------------------------------- |
| Lead     | `00-lead.md`                 | `contracts/`, `db/`, `services/api/server.js`, `auth/`, `payments/` |
| Tacras | `01-records.md`              | `mocks/legacy-records/`, `services/api/records/`, `load-tests/`     |
| Sagayno | `02-payment-gateway.md`      | `mocks/paypal-stub/`, `services/api/payment-gateway/`               |
| Lawag | `03-registration-catalog.md` | `services/api/registration/`, `catalog/`, `gateway/`                |
| John Reiner | `04-recovery.md`             | `services/api/recovery/`                                            |
| Capeleno | `05-portal-ui.md`            | `portal/`                                                           |

Only edit inside your own folders. If you need a change in `contracts/`, `db/`, `package.json` or `.github/`, open an issue for the lead. Do not edit them yourself.

## 8. Your first pull request (practice)

Everyone does this one, and it changes one line, so it is safe. Open your brief in `docs/briefs/` and replace `[name]` after `Owner:` with your name.

```powershell
git switch main
git pull
git switch -c feature/<module>-first-pr
# edit your brief and save
git add docs/briefs
git commit -m "docs: add my name to my brief"
git push -u origin feature/<module>-first-pr
```

Then open the link Git prints, or go to the repo on GitHub, and click "Compare and pull request". Fill in the template. Wait for the green CI check and the lead's review. If the lead asks for a change, push another commit to the same branch.

Use `<module>` from this list: `records`, `payment-gateway`, `registration`, `recovery`, `portal`.

## 9. Daily routine

1. `git switch main` then `git pull`.
2. New branch for each task: `feature/<module>-<short-task>`.
3. Small commits with messages like `records: add student lookup route`.
4. Before every push: `npm run lint`, `npm run format:check`, `npm test`.
5. Open a pull request into `main`. Never push to `main` directly.

## 10. Rules that protect the grade

- You must understand every line you submit, including code Claude wrote. The lead may ask you to explain it.
- No secrets in code. Passwords and PayPal keys live only in `.env`.
- No real card data anywhere. Sandbox only.
- Do not invent status names or error codes. Use the ones in `contracts/statuses.js`.
- Every call to another service needs a timeout. A payment is never created twice.
- Every feature needs a test.

## 11. While you wait for dependencies

- Members 4 and 5: the database schema and API skeleton are coming. Read the legacy mock end to end, then write a test plan for your brief.
- Member 6: build the layout and pages with clearly labeled demo data, following `docs/DESIGN.md`.
- Members 2 and 3: you can start now. The contracts and your mock are ready.

## 12. If something breaks

| Problem                                       | Fix                                                             |
| --------------------------------------------- | --------------------------------------------------------------- |
| `Could not read package.json`                 | You are in the wrong folder. `cd` into the project folder.      |
| `.env: not found`                             | Run `Copy-Item .env.example .env`.                              |
| `ECONNREFUSED 127.0.0.1:3306`                 | MySQL is not running. Start it in XAMPP.                        |
| `Access denied for user`                      | `DB_USER` or `DB_PASSWORD` in `.env` is wrong.                  |
| `EADDRINUSE` (port in use)                    | A copy is already running. Close the other terminal.            |
| Format check fails                            | Run `npm run format`, then commit.                              |
| CI is red on your pull request                | Open the run on GitHub, read the failing step, fix, push again. |
| Claude suggests editing `contracts/` or `db/` | Stop. Open an issue for the lead.                               |

Still stuck? Post the exact error text and the command you ran, not a screenshot of the whole screen.
