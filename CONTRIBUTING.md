# Contributing

## First time setup

See `README.md`. Short version: install Node 24, install MySQL (XAMPP is fine), clone the repo, run `npm install`, copy `.env.example` to `.env`.

## Using Claude on this project

Everyone's Claude must follow the same rules, so everyone uses the same files.

1. In claude.ai, create a Project for this repo.
2. Upload these files to the Project: `CLAUDE.md`, `docs/DESIGN.md`, `docs/antislop.md`, `docs/ARCHITECTURE.md`, `contracts/README.md`, `docs/Midterm_Exam_SIA.pdf`, and your own brief from `docs/briefs/`.
3. In the Project instructions write: "Follow CLAUDE.md in the project files before answering. I am working on the brief named below." and add your brief's file name.
4. When you change a file locally, paste the current version into the chat before asking Claude to edit it, so it never works from an old copy.
5. If Claude suggests changing `contracts/`, `db/`, `package.json` or anything lead-only, do not do it. Open an issue.

Using Claude is allowed and expected. Submitting code you cannot explain is not. The lead may ask you to walk through your pull request.

## Workflow

1. Pick or get assigned an issue. One issue per task.
2. `git switch main` then `git pull` then `git switch -c feature/<module>-<short-task>`.
3. Write the code and its tests. Commit in small steps with messages like `records: add student lookup route`.
4. Before pushing: `npm run lint`, `npm run format:check`, `npm test`.
5. `git push -u origin <your-branch>` and open a pull request into `main`. Fill in the template.
6. The lead reviews. Answer comments by pushing more commits to the same branch. Do not open a new pull request for fixes.
7. After merge, `git switch main`, `git pull`, and start the next task from a fresh branch.

## Review checklist (lead)

- CI is green.
- Only the module's files changed, or the exceptions are justified.
- Contracts, statuses and error codes come from `contracts/`.
- Timeouts, idempotency and transaction rules from CLAUDE.md are respected.
- Tests cover the happy path and at least one failure.
- No secrets, no debug logging, no fake data presented as real.
- UI changes include screenshots and the antislop Delivery Gate report.
- The author can explain the code.

## Repository settings (lead, once)

- Protect `main`: require a pull request, require one approval, require the CI check to pass, block direct pushes. On a private repo with a free plan these rules may be unavailable. Make the repo public or use the GitHub Student Developer Pack.
- Add the five members under Settings, then Collaborators.
- Replace `LEAD-USERNAME` in `.github/CODEOWNERS` with your GitHub username.
- Create a Project board with columns To do, In progress, In review, Done and add the issues.
