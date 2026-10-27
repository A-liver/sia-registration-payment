# DESIGN.md

Direction for the University Registration and Online Payment System (SIA midterm project).

Status: written by the agent at the owner's request, from the RMMC seal and a screenshot of the RMMC student portal. Colors are approximated from those images and checked for contrast, not copied from RMMC brand files. The owner can replace any value below.

## Design Read

Reading this as: student registration and payment portal for RMMC students and registrar/cashier staff, in a calm institutional style, dial ENERGY 1 / RHYTHM 1 / MOTION 1.

Dial: ENERGY 1 / RHYTHM 1 / MOTION 1

Reason: people pay tuition here. Calm, predictable screens build trust better than expressive ones, and the same layout on every page keeps the flow easy to learn.

## Identity

- Product: a student project prototype. It is not the official RMMC portal and must not claim to be.
- Brand source: Ramon Magsaysay Memorial Colleges, General Santos City. The seal is supplied by the owner and is the only logo.
- Seal placement: top bar, left, with the college name as text beside it. File path in the Laravel project: `public/images/rmmc-seal.png`.
- Identity motif: navy blocks with a thin silver rule beneath each card header. It echoes the seal's navy ring and silver band and repeats on every card.
- Structure borrowed from the college portal so students feel at home: left sidebar, top bar, white cards on a pale blue page. The content, labels and visuals are this project's own, not a copy of the portal or of GakkouSoft.
- Footer: "Student project prototype. Not the official RMMC portal." No vendor credit lines.

## Palette (2 core colors, 1 accent, plus neutrals)

| Role | Hex | Used for | Reason |
|---|---|---|---|
| Navy (core) | `#1F1A7A` | Brand text, top-bar title, primary buttons, card header text | Matches the seal's deep blue and the portal's title color |
| Portal blue (core) | `#2559B8` | Links, active nav item, focus ring | Matches the portal's active-item blue, darkened to pass contrast on the page background |
| Green (accent) | `#17712A` | Only for confirmed states: Paid, Enrolled | The portal already uses green for its greeting, and a single accent keeps "success" easy to spot |
| Page background | `#EEF2F9` | Page | Same pale blue the portal uses |
| Card surface | `#FFFFFF` | Cards, tables, forms | Plain white for readable forms and printable receipts |
| Border | `#D5DBE8` | Card and input borders | Quiet separation without shadows |
| Silver rule | `#C9CED8` | Motif line under card headers | The seal's silver band |
| Body ink | `#1B2033` | Body text | Near black with a blue cast to sit with the palette |
| Muted ink | `#4A5268` | Secondary text | Passes AA on white and on the page background |

Status colors are part of the system, used only inside status chips that always carry a text label and an icon, never color alone:

| Status | Text | Background |
|---|---|---|
| Paid, Enrolled | `#17712A` | `#E3F4E6` |
| Pending | `#7A4B00` | `#FFF1CC` |
| Failed, Declined | `#B3261E` | `#FCE8E6` |
| Info (sandbox notice) | `#1D4A9C` | `#E3ECFB` |

Contrast checked (WCAG AA needs 4.5:1 for normal text): navy on white 14.1, navy on page 12.6, body ink on white 16.1, muted on white 7.8, muted on page 6.9, blue on white 6.6, blue on page 5.9, green on white 6.1, green on tint 5.4, red on white 6.5, red on tint 5.6, amber on tint 6.6, info on tint 7.0. White on navy buttons 14.1.

## Typography

- Typeface: Poppins for everything. Reason: the RMMC portal students already use is set in a geometric sans that looks like Poppins, so the new screens feel familiar.
- Fallback stack: `Poppins, system-ui, "Segoe UI", Arial, sans-serif`. Self-host the font files in `public/fonts` so the demo works offline.
- Sizes: body 16px, table text 15px, page title 24px semibold navy, card title 18px semibold navy, small text 14px minimum.
- Page titles and card titles in sentence case. No uppercase labels with wide tracking. No monospace except for payment reference IDs, where fixed width makes them easy to compare.

## Theme

Light only. Reason: it matches the college portal, and payment forms and receipts read and print best on white. A dark toggle is not planned. If wanted, it must work fully in both modes before shipping (R-34).

## Layout

- One layout for every page (RHYTHM 1): top bar, left sidebar, content column with cards stacked vertically, max content width 1100px.
- Sidebar 240px with icons and text labels. Under 900px it becomes a hamburger menu that opens and closes with Enter, Space and Escape.
- One focal point per screen: the main card holding the task (course table, payment summary, enrollment status).
- Whitespace: 24px between cards, 16px inside card sections, 8px steps for everything else.
- Radius 8px on cards, 6px on buttons and inputs. No pill shapes except status chips.
- No heavy shadows. Cards use the 1px border. One light shadow (`0 1px 2px rgba(31,26,122,0.08)`) only on the open mobile menu.
- Motion: hover and focus state changes only, 150ms. No scroll effects, no animated numbers.

## Navigation (only pages that exist)

Student: Dashboard, Register courses, Tuition and payments, My enrollment.
Staff (registrar or cashier): Dashboard, Reconciliation.
Both: Sign out.

Do not add Grades, Study Load, Library or similar items from the college portal. They are not part of this system (R-24).

## Screens and required states

Every screen that shows data needs an empty, loading and error state (R-27).

- Dashboard: enrollment status and balance for the signed-in student. Empty: "No enrollment yet. Register courses to begin."
- Register courses: course table with code, title, slots left, prerequisites. Rows that cannot be taken show the reason in text ("Prerequisite not met: CS101", "No slots left").
- Tuition and payments: fee summary, then "Pay tuition with PayPal". States: ready, processing (button disabled), paid, declined, cancelled, pending, failed.
- My enrollment: status chip, payment reference, and an explanation when the update is pending ("Payment received. Enrollment update is queued and will retry automatically.").
- Reconciliation (staff): list of pending and unresolved updates with the original payment reference, a retry button, and a "mark resolved" action with a required note. Empty: "No pending updates."

## Payment screen rules

- A visible info notice on every payment screen: "Sandbox mode. No real money is charged."
- Never display "secure", "encrypted" or compliance badges as claims (R-36).
- The pay button is disabled while a request is running, so it cannot be submitted twice.
- After a failed legacy update, the student sees "Payment received" first, then the pending enrollment status. The screen must never suggest paying again.
- The payment reference is shown once the payment is verified, in monospace, with a copy button.

## Components

- Buttons: primary (navy fill, white text), secondary (white fill, navy border), danger only for destructive actions. Minimum height 44px.
- Inputs: 44px height, visible label above, error text below in red with an icon.
- Tables: 15px text, header row in navy text on `#F5F7FC`, horizontal scroll inside the card on small screens, never on the page body.
- Status chips: icon plus text, colors from the status table.
- Focus: a 3px `#2559B8` outline with 2px offset on every interactive element. Never `outline: none` without this replacement.
- Icons: simple filled icons in the portal's style, only where they clarify a label (course, payment, user, warning). Not decoration.

## Copy rules

- Plain, specific wording. CTAs name the action: "Register for this course", "Pay tuition with PayPal", "Retry enrollment update".
- No buzzwords (seamless, powerful, effortless, and similar).
- No em dashes anywhere in the UI. Use commas, periods, colons or parentheses.
- No statistics, testimonials or FAQ. Numbers on screen come from the database.

## Data and placeholders

- Seeded students, courses and fees are sample data. Mark them in the UI as demo data wherever they appear.
- Demo login accounts are listed on the sign-in page in a clearly labeled "Demo accounts" box.
- Anything not yet supplied by the owner (real fee amounts, real course lists, real staff names) is shown as `[REAL DATA]` or "Coming soon", never invented as final.

## Decisions to confirm

1. Light only theme (see Theme). Say so if you want a dark toggle.
2. Poppins as the typeface. Say so if the college specifies another.
3. Exact brand hex values, if RMMC has an official brand sheet.
