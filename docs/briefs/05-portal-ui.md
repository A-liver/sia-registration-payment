# Brief 05: Portal UI

Owner: [name]

## You own

`portal/`

## Rules

Follow `docs/DESIGN.md` and `docs/antislop.md` exactly. Plain HTML, CSS and vanilla JavaScript, no framework, no build step. The seal goes at `portal/images/rmmc-seal.png` (the lead supplies the file). Poppins files are self-hosted in `portal/fonts/`.

## Tasks

1. Shared layout: top bar with seal and college name, left sidebar, content column. CSS variables for every DESIGN.md token in one `portal/css/tokens.css`. Hamburger menu under 900px, keyboard accessible.
2. Pages: sign-in (with a labeled demo accounts box), dashboard, register courses, tuition and payments, my enrollment, and for staff, reconciliation. Navigation links only to pages that exist.
3. Every data view has loading, empty and error states. Status chips use icon plus text.
4. Tuition and payments page: fee summary, PayPal button using PayPal's JavaScript (client ID comes from the API, never hard-coded), sandbox notice, and separate states for processing, paid, declined, cancelled, pending and failed. The pay button is disabled while a request runs.
5. Until the backend routes exist, develop against small clearly labeled demo data in `portal/demo-data/`, and remove it when the real routes land.
6. Check at phone width and with the keyboard. Contrast must pass AA.
7. For every pull request: screenshots at desktop and phone width and the antislop Delivery Gate report (PASS or FAIL per item).

## Don't touch

Anything outside `portal/`. If a page needs an API field that is not in `contracts/README.md`, open a Task issue.

## Done when

All pages work against the real API, all states are reachable and screenshotted, and the Delivery Gate has no FAIL.

## Report sections you can write

System overview (Student Web Portal), Figure 1 presentation boundary notes, and the screenshots appendix.
