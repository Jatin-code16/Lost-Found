# PRD: Campus Lost & Found with Private Recovery

Oct 24, 2026 · @DEEPAK PANDEY

## Summary

**Working name: Kho-Paya** (Hindi for "lost-found"; rename freely). A campus web app where students post found items with the identifying details hidden. Owners prove ownership by answering a secret question only the real owner can answer. The two sides then talk through a masked chat and hand over with a one-time code. Nobody's phone number, email or room number is ever shown to another student.

**Problem.** Today, lost items on campus get posted in WhatsApp groups with a photo and the finder's phone number. That exposes contact details to hundreds of strangers. It also invites false claims, because the photo shows exactly what to describe. And it buries posts within hours.

**Idea sentence.** On this app, the detail the photo hides becomes the key that unlocks the item.

**Three principles**

1. **Contact never travels; messages do.** All contact is relayed and expires when the case closes.
2. **Show enough to recognise, never enough to fake.** Public posts show category, zone and day. The telling detail stays hidden.
3. **A handover is a verified event, not a meeting.** It happens at a known place, and both sides confirm with a code.

## Your decisions (defaults filled in)

These are the choices only you should make. Each has a default so the build can start now. Change any cell and the rest of the PRD still holds.

| Decision | Default | Alternatives |
| --- | --- | --- |
| Who can sign in | College email only (OTP to @college domain) | Roll number + OTP; open sign-up |
| Where handovers happen | Security desk at the main gate, or a named "safe spot" (library counter) | Anywhere both agree |
| Sensitive items (ID card, wallet, phone, keys) | Never shown publicly; must go to the desk; owner verified there | Same as other items |
| How long a found post stays | 30 days, then the desk decides (return to the desk, donate, dispose) | 14 or 60 days |
| Matching | Rule-based (category + zone + date + colour) | AI image matching (later) |
| Reward or thanks | A "thank you" note to the finder, no money | Karma points; none |
| Language | English + Hindi labels | English only |
| Name | Kho-Paya | Your own |

**Your one true detail goes here:** \[the place on your campus where things are lost most, or a real story\]. Put it in the headline and the demo.

## Users and scenarios

Three roles. Students are both owners and finders; the security desk is the trusted middle.

| Role | Who | What they need | What they fear |
| --- | --- | --- | --- |
| Owner | Student who lost something | Know fast if it was found; get it back without a hunt | Never seeing it again; someone else claiming it |
| Finder | Student, staff or housekeeping who found something | Do the right thing in under a minute | Their number going to strangers; being blamed if it goes wrong |
| Desk | Security guard or lost-and-found officer | A log of items held; proof of who collected what | Disputes; handing an ID card to the wrong person |

**Scenarios**

1. **Calculator before the exam.** Riya leaves her scientific calculator in Lab 3 after the 2 pm practical. Aman finds it at 4 pm and posts it: category "Calculator", zone "Lab block", photo with the back hidden. He sets the secret question "What is written on the back?" Riya sees the match alert and answers "R.S. CSE-B". They chat without numbers and meet at the library counter the next morning with a 4-digit code.
2. **ID card at the canteen.** A canteen worker finds an ID card. Sensitive items skip the public feed. The card is logged straight to the desk, and only the owner whose roll number matches gets a private alert.
3. **Lost, not yet found.** Kabir loses a black umbrella on the bus. He files a private lost report. Nothing matches for two days. On day 3 someone posts a black umbrella from the bus stop, and Kabir gets an alert.

## Goals, non-goals, metrics

**Goals**

- A finder can post an item in under 60 seconds from a phone.
- An owner learns of a likely match without searching every day.
- No personal contact detail is ever visible to another student.
- Every return is verified and logged.

**Non-goals (v1)**

- Payments or rewards.
- Native mobile apps (the web app is mobile-first and installable).
- AI image recognition, GPS tracking or Bluetooth tags.
- Use outside one campus.

**Success metrics** (targets are proposals to confirm after a pilot)

| Metric | How measured | Target |
| --- | --- | --- |
| Recovery rate | Items marked returned ÷ items posted | Above 50% within a semester |
| Time to recovery | Median hours from post to handover | Under 48 h |
| Contact leaks | Phone numbers, emails or handles exposed to other users | 0 |
| False-claim rate | Claims rejected at the desk ÷ claims approved | Under 5% |
| Finder effort | Median time to post a found item | Under 60 s |

## Core flows

There are three ways in and one gate. Every path reaches the item only through the secret question or the desk.

&#91;embedded content: core flows · 3 entry points, 1 verification gate\]

A found post enters the public feed with its details hidden. A lost report stays private and only raises an alert when a post matches. ID cards, wallets and phones never reach the feed and are returned at the desk after an in-person check. Contact happens only after verification, through aliases, and the case closes with the one-time code.

## Privacy and safety model

Privacy is the product here, not a setting. Each rule below closes a specific way the WhatsApp-group method fails.

| Risk today | Rule in this app |
| --- | --- |
| Finder's phone number posted to hundreds | No contact fields exist on posts. All messages go through a masked chat ("Finder #4821" and "Owner #1170"). The chat locks when the case closes and is deleted after 30 days. |
| Photo shows exactly what to describe, so anyone can claim | The finder blurs or crops identifying marks before posting and writes a secret question. The answer is stored hashed and never shown. |
| Strangers meeting in hostels or empty corridors | Handover only at a listed safe spot (security desk, library counter) during open hours. The app never asks for room numbers. |
| ID cards and wallets exposed in public posts | Sensitive categories are never public. They go to the desk, and only an owner whose roll number or name matches gets a private alert. |
| No record of who took what | Each handover needs a one-time 4-digit code shown to the owner and entered by the finder or desk. The log keeps who, what, when and where. |
| Harassment through the chat | Chat is text only, no images or links. Block and report buttons are on every chat. Reports go to the desk, and repeat offenders are suspended. |
| Fishing ("I lost a black phone" to see every phone) | Lost reports are private and visible only to their owner. Owners get match alerts; they cannot browse hidden details. |

**Data kept:** college email (to sign in, never shown), display alias, posts, hashed answers, chat (30 days), handover log (one academic year). **Not collected:** phone number, room number, social handles, location tracking.

## Functional requirements

P0 = needed for the demo and the pilot. P1 = pilot. P2 = later.

| ID | Requirement | Priority |
| --- | --- | --- |
| F1 | Sign in with a college email and OTP; get an anonymous alias | P0 |
| F2 | Post a found item: photo (with crop or blur tool), category, campus zone, date, colour, short public description | P0 |
| F3 | The finder sets a secret question plus answer (or picks from a list per category); the answer is stored hashed | P0 |
| F4 | Browse and search the found feed by category, zone and date, with hidden details masked | P0 |
| F5 | Claim: answer the secret question; 3 attempts per item per day; a wrong answer is not revealed as "close" | P0 |
| F6 | Masked chat between finder and verified claimant only | P0 |
| F7 | Handover: pick a safe spot and time; a one-time code confirms the return; the item is marked returned | P0 |
| F8 | File a private lost report (category, zone, date range, colour, private notes) | P1 |
| F9 | Auto-match lost reports to new found posts, with an alert to the owner | P1 |
| F10 | Sensitive category routing: never public; desk intake; private alert to a matching roll number | P1 |
| F11 | Desk dashboard: items held, claims pending, handover log, expiry queue | P1 |
| F12 | Report and block in chat; desk moderation | P1 |
| F13 | Expiry after 30 days with a desk decision | P1 |
| F14 | Thank-you note from owner to finder | P2 |
| F15 | Notice-board QR poster: scan to post a found item without signing in, then hand it to the desk | P2 |

## Screens and UX notes

Six screens, phone-first; the finder's path is the shortest.

1. **Home:** two big actions, "I found something" and "I lost something". Below them, a feed of today's found items grouped by campus zone (Library, Canteen, Lab block, Hostel gate, Bus stop, Ground).
2. **Post found (3 steps):** photo with a crop/blur brush; category and zone as tap chips; the secret question. The default questions per category: calculator, "What is written or stuck on the back?"; bottle, "What sticker or dent?"; bag, "What is inside the front pocket?"
3. **Item page:** blurred photo, category, zone, day, short note, and a "This is mine" button. No finder name, no contact.
4. **Claim:** the question, an answer field, and attempts left. A correct answer opens the chat; a wrong one just says "Not a match".
5. **Chat and handover:** aliases only; quick replies ("Library counter, 10 am?"); a safe-spot picker; the owner's 4-digit code, which the finder or desk enters to close the case.
6. **Desk dashboard:** held items, pending claims, today's handovers, the expiry queue.

**The one live thing for the demo:** the claim moment. A wrong answer keeps the photo blurred; the right answer un-blurs it and opens the chat. Judges see privacy and verification in one gesture.

**Design direction** (from the kit's diverge step; pick or change): the item page styled as a **paper lost-property tag**, with a string hole, a serial number (#4821) and a tear-off stub that becomes the handover code. Avoid purple gradients, icon-card grids and stock "Welcome to" copy.

## Data model

Five records; nothing in them holds a phone number or room.

| Record | Key fields | Visible to |
| --- | --- | --- |
| User | id, college email (private), alias, role (student / desk / admin), strikes | Self; desk sees email only during a dispute |
| FoundItem | id, serial, finder\_id, category, zone, found\_on, colour, public\_note, photo\_blurred, photo\_original, question, answer\_hash, sensitive, status, expires\_on | Public: serial, category, zone, date, colour, note, blurred photo. Private: the rest |
| LostReport | id, owner\_id, category, zone, date\_from, date\_to, colour, private\_notes, status | Owner only |
| Claim | id, item\_id, claimant\_id, attempts, verified\_at, status | Finder, claimant, desk |
| Handover | id, item\_id, spot, scheduled\_at, code\_hash, confirmed\_by, confirmed\_at | Both parties, desk |

**Item status:** Posted → Claimed (verified) → Handover scheduled → Returned. Side exits: Expired (30 days) → At desk / Donated, and Removed (by moderation).

**Matching rule (F9):** same category, zone within the same or a neighbouring zone, found date within the lost date range plus 2 days, and colour equal when both are given. Score = number of fields that agree. Alert at 3 or more.

## Non-functional requirements

- **Mobile-first:** usable at 390 px wide on a cheap Android phone over a weak campus connection; photos compressed to under 300 KB before upload.
- **Accessible:** WCAG 2.2 AA contrast, keyboard and screen-reader paths, visible focus, labels on every field, 44 px tap targets.
- **Secure:** answers hashed (bcrypt or argon2) with an attempt limit; one-time codes valid 24 h; HTTPS only; the original photo is never sent to a non-verified user.
- **Private by design:** minimum data, deletion schedule as above, no third-party trackers.
- **Fast:** feed loads in under 2 s on 3G; posting works offline and syncs later.
- **Bilingual:** English and Hindi labels.
- **Auditable:** every claim, code and desk action is logged with time and actor.

## Edge cases and abuse

| Case | Handling |
| --- | --- |
| Two people answer correctly | Chat opens with the first; the second is queued. If the finder doubts it, the case moves to the desk, which asks for a second detail. |
| Item has no unique detail (plain black umbrella) | The finder picks "No unique mark". Claims then go through the desk, which asks the owner for time and place details. |
| Owner forgot the detail | "Verify at desk instead" option with the owner's college ID card in person. |
| Guessing answers | 3 attempts per item per day per user; no hints; repeated failures across items add a strike. |
| Finder never shows up | After 48 h without handover, the finder is asked to drop the item at the desk. |
| Fake found posts (to lure someone) | Handover only at safe spots; meeting elsewhere is not offered. Reports go to moderation. |
| Photo shows a face or ID | The blur tool is mandatory for sensitive categories; desk review before publishing. |
| Item found off campus or on the bus | Zone "Transport" with the route number; same flow. |
| Student graduates or leaves | Account closes; their open items move to the desk. |

## Arena build slice and demo script

Build P0 only (F2 to F7) as one HTML file with localStorage. That fits in about 60 to 75 minutes and demos every principle.

**Build order**

- [ ] Tokens and the lost-property-tag look; home with the two actions and a feed seeded with 6 realistic items (marked "sample")
- [ ] Post found: photo upload, CSS blur on chosen regions (or a blur toggle), category and zone chips, secret question
- [ ] Item page and claim: the answer is hashed with Web Crypto SHA-256 and compared; 3 attempts; un-blur on success
- [ ] Masked chat between two aliases, simulated with a "switch user" toggle
- [ ] Handover: safe-spot picker, 4-digit code, mark returned
- [ ] Sign-in simulated ("OTP sent to @college email"); say in the demo that it is simulated
- [ ] Run slop-check and render-check; fix the top 3; signature pass on headline and button

**90-second demo**

1. The problem in one line: "Today a lost calculator means your number in a 500-member WhatsApp group."
2. As the finder: post the calculator in under 60 seconds, blur the name on the back, set the question.
3. As a stranger: try to claim with a wrong answer. Photo stays blurred, "Not a match".
4. As the owner: right answer, the photo un-blurs, the masked chat opens.
5. Pick "Library counter, 10 am", show the code, mark returned.
6. Close with the human part: what you decided (safe spots, the hidden-detail rule, no phone numbers) and what the AI built.

## Risks and open questions

| Risk | Mitigation |
| --- | --- |
| Low adoption: students stay in WhatsApp groups | QR posters at the library, canteen and bus stop; desk staff post on behalf of walk-ins; one-tap share of a post's link (no contact) into the group |
| Desk lacks time | A dashboard showing only today's handovers; weekly expiry batch |
| Secret questions too easy to guess | Category-specific default questions; finder can add a second question for valuables |
| Data protection compliance | Collect the minimum; publish a one-page privacy notice; deletion schedule; follow the DPDP Act 2023 notice and consent rules (to confirm with the college) |

**Open questions**

- [ ] Will the security office agree to be the handover point and keep the log?
- [ ] Can the college email domain send OTPs, or is roll number + OTP needed?
- [ ] Which zones does your campus actually have? (replace the sample list)
- [ ] Who moderates reports: security, a faculty coordinator, or a student council member?
