# Kho-Paya: project details

A campus lost-and-found where the detail the photo hides becomes the key that unlocks the item.

Finders post what they found with the identifying mark blurred and set one question about it. Owners prove ownership by answering that question, talk to the finder through a masked chat, and close the case with a one-time 4-digit code at a safe spot on campus. Nobody's phone number, email or room number is ever shown to another student.

This document describes the build as it stands on Oct 24, 2026. The product requirements live in [the PRD](../PRD%20Campus%20Lost%20%26%20Found%20with%20Private%20Recovery.md); how to run the demo quickly is in the [README](../README.md).

---

## 1. The problem and the idea

**Today**, a lost item on campus gets posted in a WhatsApp group with a photo and the finder's phone number. That goes wrong in three ways:

1. The finder's number reaches hundreds of strangers.
2. The photo or text shows exactly what to describe, so anyone can claim the item.
3. The post is buried within hours.

**The idea**: hide the one detail that proves ownership (a name on a sticker, a dent, a doodle) and turn it into the question the owner must answer. The public sees enough to recognise the item, never enough to fake a claim.

**Three principles** (from the PRD), each enforced in code:

| Principle | How the app enforces it |
|---|---|
| Contact never travels; messages do. | Posts have no contact fields. Chat uses aliases. Messages containing a phone number, email, link, social handle or room number are refused before they are sent. |
| Show enough to recognise, never enough to fake. | The feed shows category, zone, day, colour and a blurred photo. The answer is stored only as a salted hash. The original photo is shown only to a verified owner, the finder and the desk. |
| A handover is a verified event, not a meeting. | Handovers are offered only at listed safe spots during open hours. The owner holds a 4-digit code; the finder or the desk types it in to close the case. |

---

## 2. Run it

| Way | Command | Notes |
|---|---|---|
| Open the file | Open `index.html` in Chrome, Edge or Firefox | Everything works, including the camera in Chromium browsers. Offline caching is off. |
| Local server | `npm start`, then open http://localhost:5173 | Needs Node 18 or later. No dependencies. Turns on the offline shell (service worker). |

There is no build step and no package to install. All data stays in the browser's `localStorage` under the key `khopaya.v1`. **Reset demo** in the top bar deletes everything made in this browser and restores the sample data.

### Demo accounts

Pick one in the **Viewing as** menu in the top bar, or on the sign-in page. Names appear only in that demo menu; inside the app everyone is an alias.

| Account | Alias | Role in the demo |
|---|---|---|
| Aman (finder in scenario 1) | Student #4410 | Posts the calculator |
| Riya (owner in scenario 1) | Student #1170 | Claims the calculator |
| A stranger trying to claim | Student #2290 | Gets "Not a match" |
| Kabir (lost umbrella, scenario 3) | Student #3306 | Has a private lost report and an ID card waiting at the desk |
| Ishaan (owner of the steel bottle) | Student #5530 | Has a handover booked for today |
| Security desk, main gate | Security desk | Runs the desk dashboard |

### The 90-second demo

1. **Viewing as Aman**: *I found something* → *Use the demo calculator photo* (or *Open the camera*) → paint over the sticker → zone *Lab block* → keep the default question → answer `R.S. CSE-B` → *Post the tag*. The page shows how long posting took.
2. **Viewing as A stranger**: open the new tag → *This is mine* → answer anything. The stamp says *Not a match*, the photo stays blurred and one of three tries is used.
3. **Viewing as Riya**: same tag → answer `rs cse-b`. The photo un-blurs and the masked chat opens.
4. In the chat, type a phone number to show it is refused. Tap *Library counter, 10 am?* and propose the handover. Use *see this case as Finder* to accept, switch back to read the owner's code on the stub, switch again and type it in as the finder. The case closes and the chat locks.
5. Optional: as **Ishaan**, post a black umbrella at *Bus stop* with *No unique mark*; **Kabir** gets a match alert. As **Security desk**, open *Desk* to see the register.

The landing page (`#/`) also has a self-contained version of step 2 and 3: guess what is written on the calculator, or use *Play the owner* to get the answer and see the reveal.

---

## 3. Screens and routes

The app is a single page with hash routes.

| Route | Screen | Who can use it |
|---|---|---|
| `#/` | **Landing page**: the whole page is one lost-property tag, with a try-to-claim demo, the three rules, how a tag gets home, the WhatsApp comparison, who it is for, and a tear-off stub that opens the app | Everyone |
| `#/feed` | **Found feed**: the two big actions, filters (search, category, zone, day) and tags hanging on rails grouped by campus zone | Everyone |
| `#/signin` | **Sign in**: college email, then a 6-digit code (simulated), plus the demo accounts | Everyone |
| `#/found/new` | **Post found** in 3 steps: photo (camera, upload, demo photo or none) with a blur brush; details; secret question | Signed in |
| `#/lost/new` | **Report lost**: a private report that raises alerts on a match | Signed in |
| `#/item/1234` | **Item page**: the tag with blurred photo, fields, note and *This is mine* | Everyone (sensitive items show only a notice) |
| `#/item/1234/claim` | **Claim**: the question, the answer field, tries left; the un-blur moment | Signed in, not the finder |
| `#/case/1234` | **Case**: masked chat, safe-spot picker, the owner's code on the tag's stub, code entry for the finder | Finder, verified owner, desk |
| `#/mine` | **My tags**: things I found, things I claimed, my private lost reports, thank-you notes | Signed in |
| `#/alerts` | **Alerts**: match alerts, answers on my posts, desk notices | Signed in |
| `#/desk` | **Desk dashboard**: handovers due, claims to check, items held, expiry queue, chat reports, walk-in intake, the register | Desk role only |
| `#/privacy` | **Privacy notice**: what is kept, for how long, what is never collected | Everyone |
| `#/desk-info` | **Safe spots and hours** | Everyone |

---

## 4. Features against the PRD

| ID | Requirement | Status in this build |
|---|---|---|
| F1 | Sign in with college email and OTP; anonymous alias | **Simulated.** Only `@college.edu.in` addresses are accepted; the code is shown on screen instead of emailed. New users get a random `Student #NNNN` alias. |
| F2 | Post a found item: photo with crop or blur, category, zone, date, colour, public note | **Built.** Live camera, file upload or demo photo; brush blur in three sizes with undo, clear and "blur the whole photo" (keyboard-friendly). Photos are compressed to under 300 KB. Picking *Other* asks "What did you find?". |
| F3 | Secret question and hashed answer | **Built.** Default question per category, editable. Answer stored as salted SHA-256. "No unique mark" option sends claims through the desk. |
| F4 | Browse and search the feed with hidden details masked | **Built.** Search, category, zone and day filters; grouped by zone. |
| F5 | Claim: 3 tries per item per day; wrong answer never "close" | **Built.** Answers are normalised (case, spaces, dots and "a/the" ignored) and compared by hash. A wrong answer only says *Not a match*. |
| F6 | Masked chat between finder and verified claimant | **Built.** Aliases only, text only, quick replies, contact details refused. |
| F7 | Handover at a safe spot with a one-time code | **Built.** Propose and accept a spot and time within open hours; 4-digit code valid 24 hours, 5 wrong tries max; case closes as *Returned*. |
| F8 | Private lost report | **Built.** |
| F9 | Auto-match lost reports to found posts with an alert | **Built.** Rule in section 6. Runs both when a tag is posted and when a report is filed. |
| F10 | Sensitive categories never public; desk intake; private alert to matching roll number | **Built.** ID card, wallet, phone and keys go to the desk. Blur is required if a photo is added. |
| F11 | Desk dashboard | **Built.** |
| F12 | Report and block in chat; desk moderation | **Built.** Block locks the chat and hands the case to the desk. Desk can uphold (strike) or dismiss, and remove posts. |
| F13 | Expiry after 30 days with a desk decision | **Built.** Keep at desk, donate or dispose. |
| F14 | Thank-you note from owner to finder | **Built.** Contact details are refused here too. |
| F15 | QR poster: post without signing in | **Not built.** |

### Edge cases from the PRD

| Case | Handling |
|---|---|
| Two people answer correctly | The first opens the chat; the second is queued. If the desk rejects the first, the queued claim is promoted. |
| Item has no unique mark | Claims go to the desk with the owner's account of when and where it was lost. |
| Owner forgot the detail | *Verify at the desk instead*, with the college ID in person. |
| Guessing answers | 3 tries per item per day; failed answers on 3 different items in one day add a strike; 3 strikes suspend the account. |
| Finder never shows up | 48 hours after the booked time, the finder is asked to drop the item at the desk; the desk sees it flagged. |
| Item found on the bus | Zone *Transport* with a route number. |
| Finder doubts the claim | *Ask the desk to check*: the claim moves to the desk, which approves or rejects it. |

---

## 5. Privacy and safety model

| Risk with the WhatsApp group | Rule in this app |
|---|---|
| Finder's number posted to hundreds | No contact fields on posts. Chat as *Finder #4821* and *Owner #1170*. Chat locks when the case closes and is deleted 30 days later. |
| The photo shows what to describe | The finder blurs the mark and writes a question. The answer is stored hashed and never shown, not even to the finder. |
| Strangers meeting in hostels | Handover only at the Security desk, main gate, or the Library counter, during open hours. No room numbers asked. |
| ID cards and wallets in public posts | Sensitive categories never reach the feed; only the student whose roll number matches gets a private alert. |
| No record of who took what | One-time code at handover; the register keeps who, what, when and where. |
| Harassment through the chat | Text only; report and block on every chat; strikes and suspension. |
| Fishing for items | Lost reports are private; owners get alerts but cannot browse hidden details. |

**The contact filter** refuses any message, note, item name or thank-you that looks like an email address, a link (including `wa.me` and `t.me`), a run of 7 or more digits, a social handle or app name, or a room number (in English, or the Hindi word for room).

**Data kept**: college email (never shown; the desk can view it only during a dispute, and that view is written to the register), alias, posts, hashed answers, private lost reports, chat (30 days after close), handover log.
**Never collected**: phone numbers, room numbers, social handles, location.

---

## 6. Data model and rules

All records are plain JSON objects in one `localStorage` entry.

| Record | Key fields |
|---|---|
| User | id, email (private), aliasNo, role (`student` or `desk`), roll (private), strikes, suspended |
| Found item | id, serial (4 digits), finderId, category, otherLabel, zone, route, foundOn, colour, note, photoBlurred, photoOriginal, question, salt, answerHash, noMark, sensitive, rollOnItem, status, expiresOn, claimId, closedAt, postSeconds |
| Lost report | id, ownerId, category, otherLabel, zone, dateFrom, dateTo, colour, notes, status |
| Claim | id, itemId, claimantId, attempts per day, verifiedAt, status (`open`, `verified`, `queued`, `desk`, `dispute`, `rejected`, `returned`), note |
| Handover | id, itemId, claimId, spot, scheduledAt, proposedBy, accepted, codeSalt, codeHash, validUntil, codeTries, confirmedBy, confirmedAt |
| Also | messages, alerts, reports, blocks, thanks, and the register (log) |

**Item status**: Posted → Owner verified → Handover booked → Returned. Side exits: Expired → At the desk, Donated or Disposed; Removed by moderation.

**Matching rule (F9)**: one point each for
1. the same category (two *Other* items count only if their names share a word, so "laptop charger" matches "phone charger" but not "cricket ball"),
2. the same or a neighbouring zone,
3. a found date within the lost date range plus 2 days,
4. the same colour when both are given.

An alert goes out at 3 points or more.

**Rules in code** (`assets/store.js`):

| Setting | Value |
|---|---|
| Tries per item per day | 3 |
| Found post lifetime | 30 days |
| Chat kept after close | 30 days |
| Handover code valid | 24 hours |
| Finder no-show flag | 48 hours |
| Strikes before suspension | 3 |

**Hashing**: answers and codes are hashed as SHA-256 of `salt + ":" + normalised text`, through Web Crypto, with a pure-JavaScript fallback that was checked against Node's SHA-256. The pilot should move this to a server with bcrypt or argon2, as the PRD asks.

---

## 7. Design

**Direction**: the lost-property tag, from the PRD. Every item is a manila card with clipped top corners, a punched eyelet, a serial number in condensed type, printed fields on dotted lines and a perforated stub that becomes the handover code. On the feed, tags hang from strings grouped by zone like hooks on the desk's pegboard. The landing page is one giant tag; its stub is the button into the app.

**Colour** (committed: the manila tag holds the eye):

| Role | Token | Value | Comes from |
|---|---|---|---|
| Ground | `--ground` | `#DCE2E9` | The security desk's carbon-copy register |
| Surface | `--surface` | `#F2F4F6` | Paper forms |
| Tag | `--tag` | `#E5CA90` | Manila property tag |
| Ink | `--ink` | `#17202B` | Ballpoint blue-black |
| Stamp | `--stamp` | `#9E1429` | Rubber stamp; used only for verdicts like *Not a match* and for focus rings |
| Returned | `--ok` | `#2E5B23` | The *Returned* and *Verified* stamps |

**Type**: Teko (condensed display) for headlines, serials, stamps and codes; Hind for reading. Both are loaded from Google Fonts with system fallbacks.

**Motion**: one authored moment, the photo un-blurring on a correct answer. Stamps press in, and the stub shifts on a returned case. All motion is cut to near zero under `prefers-reduced-motion`.

**Imagery**: the sample items are drawings made for this app in code (`assets/drawings.js`). Their hidden mark is drawn only for someone allowed to see it; everyone else gets a smudge, so the detail never reaches their page.

---

## 8. Accessibility

- One H1 per screen; landmarks; `lang="en"`; skip link; page focus moves to the H1 on route change.
- Every control is a real button, link or form field, reachable by keyboard, with a visible red focus ring.
- Labels on every field; errors next to the field with `role="alert"`; chat and verdicts in live regions.
- Tap targets 44 px or larger; text 16 px or larger for reading.
- The blur brush has a keyboard alternative (*Blur the whole photo*); the camera moves focus to *Take the photo*.
- Contrast checked by the render check: no failures at 1440, 768 or 390 px.

---

## 9. Tech stack

Plain web platform, no framework, no build step, no npm dependencies. The page is three classic scripts, so it also runs by opening `index.html` straight from disk.

### Front end

| Layer | What is used | Where |
|---|---|---|
| Markup | HTML5, semantic landmarks, native forms | `index.html`, views in `assets/app.js` |
| Styling | CSS3 with custom properties (design tokens), Grid, Flexbox, `clip-path` for the tag shape, `aspect-ratio`, `text-wrap: balance`, media queries (phone first), `prefers-reduced-motion` | `assets/app.css` |
| Logic | Vanilla JavaScript (ES2020), one IIFE module per file, no libraries | `assets/*.js` |
| Routing | Hash router (`#/feed`, `#/item/1234`) with `URLSearchParams` for query strings | `assets/app.js` |
| Rendering | HTML template strings with escaping; events delegated from `<main>` through `data-action` and `data-form` | `assets/app.js` |
| Graphics | Inline SVG drawings built in code; the app icon is SVG | `assets/drawings.js`, `assets/icon.svg` |
| Fonts | Teko and Hind from Google Fonts, with system fallbacks | `index.html` |

### Browser APIs

| API | Used for |
|---|---|
| `localStorage` | All app data (key `khopaya.v1`); the arena build has no server |
| Web Crypto: `crypto.subtle.digest` | Salted SHA-256 of secret answers and handover codes (pure-JS fallback included) |
| Web Crypto: `crypto.getRandomValues` | Serial numbers, aliases, salts, one-time codes |
| `TextEncoder` | Bytes for hashing |
| Canvas 2D | Blur brush (blur filter or downscale fallback, masked compositing), JPEG export and compression to under 300 KB |
| MediaDevices `getUserMedia` | Live camera viewfinder, front and back camera switch |
| Pointer Events | Painting the blur with a finger, pen or mouse |
| File input with `capture` and `URL.createObjectURL` | Choosing or taking a photo |
| Service Worker and Cache API | Offline shell, network first, cache fallback (only when served over http) |
| Web App Manifest | Installable on a phone |
| Web Share API, Clipboard API | Sharing a tag's link (no contact details in it) |
| `FormData`, `requestSubmit`, `requestAnimationFrame` | Forms, quick replies, the un-blur moment |
| `Intl` dates (`en-IN`) | "Today", "Yesterday", weekday and time labels |

### Server and tooling

| Piece | What it is |
|---|---|
| `server.mjs` | Zero-dependency static server on Node.js 18+ built-ins (`http`, `fs`, `path`, `url`); blocks path traversal and the `.agents` folder |
| `npm start` | Runs that server on port 5173 |
| `npm run check` | `slop-check.mjs`: source scan for default design patterns and accessibility gaps |
| `npm run render` | `render-check.mjs`: renders at 1440, 768 and 390 px and checks overflow, headline length, fonts, contrast, focus and console errors (needs Playwright) |
| Playwright 1.48.2 with Chromium | Used for the end-to-end, camera and render tests; installed outside the project, so it is not a project dependency |

### Not in the stack (on purpose)

No framework, bundler, TypeScript, CSS preprocessor, database, backend, analytics or third-party trackers. The PRD's privacy rules ask for no trackers; the rest keeps the demo a set of files you can open directly.

### What a pilot adds

A real backend is needed for the pilot (section 14): college-email OTP, server-side bcrypt or argon2 for answers and codes, a database for posts, claims and the register, and photo storage that releases the original only to a verified owner. The specific server stack has not been chosen.

---

## 10. Files

| Path | What it holds |
|---|---|
| `index.html` | Page shell: demo bar, header, main, footer, toast |
| `assets/store.js` | Data layer: seed data, rules, hashing, contact filter, matching, every action (post, claim, chat, handover, desk) |
| `assets/app.js` | Views and router: landing, feed, sign-in, post found (with camera and blur editor), lost report, item, claim, case, my tags, alerts, desk, privacy, safe spots |
| `assets/drawings.js` | SVG drawings of the sample items, with the hidden mark shown only on request |
| `assets/app.css` | Design tokens and all styles, phone first |
| `assets/icon.svg` | App icon (a tag) |
| `manifest.webmanifest`, `sw.js` | Installable app and offline shell |
| `server.mjs`, `package.json` | Zero-dependency local server (`npm start`) and scanner scripts |
| `.github/workflows/deploy-pages.yml` | Free deploy to GitHub Pages on every push; publishes only the app files |
| `.gitignore` | Keeps tooling output, logs, env files and editor files out of Git |
| `README.md` | Quick start, demo script, sample content to confirm |
| `docs/process-note-kho-paya.md` | Who decided what (human and AI) |
| `docs/PROJECT-DETAILS.md` | This document |
| `docs/DEPLOYMENT.md` | Free deployment guide (GitHub Pages, Netlify, Cloudflare Pages, Vercel) and demo-day checklist |
| `docs/ROADMAP.md` | Future add-ons, each with a free way to build it |
| `docs/screenshots/` | Real renders of the app used in the README |

The code is about 3,000 lines of plain HTML, CSS and JavaScript, with no framework and no build step.

---

## 11. How it was checked

| Check | Result |
|---|---|
| Full demo journey (post, wrong claim, right claim, refused phone number, handover, code, return, thank-you, umbrella match, desk, sign-in, lost report) scripted in Playwright | Passes, no console errors |
| Camera: open, switch, capture into the editor, cancel, camera off when leaving, permission refused | Passes with Chromium's simulated camera |
| *Other* item: required name, contact filter, shown on tag, title, search, alerts, desk | Passes |
| Landing try-it: wrong, hint, right, out of tries, start again, stub link | Passes at 390 and 1440 px |
| Render check at 1440, 768 and 390 px | 0 failures; 2 warnings (more than five font sizes) |
| Source scan (`npm run check`) | Tier Low, 0 failing checks |
| Keyboard tab-through of the feed at phone width | Logical order, visible focus |
| No Hindi on screen (13 pages swept) | 0 |

**Not checked**: a real phone and a real camera; a screen reader; a reviewer who had not seen the build.

---

## 12. Decisions log

**From the PRD (human)**: the problem, the three principles, every default in the decisions table, the scenarios, the lost-property-tag direction, and the things to avoid (purple gradients, icon-card grids, stock greeting copy).

**During the build (human)**:
- Landing page direction A, the giant tag, chosen over a desk-register story and a quiet notice page.
- The true detail on the landing is the PRD's sample story (a calculator left in Lab 3 after the 2 pm practical).
- English only. This overrides the PRD's English + Hindi default.
- Choosing *Other* must ask what was found.
- A live camera for taking the photo.

**During the build (AI, not yet reviewed by the human)**: the colour palette, the fonts, the headline "The mark you hide is the key.", building most of the P1 features, the zone neighbours used for matching, and all sample data.

---

## 13. Sample content to confirm before a pilot

- Email domain `college.edu.in` (`COLLEGE_DOMAIN` in `assets/store.js`).
- Zones: Library, Canteen, Lab block, Hostel gate, Bus stop, Ground, Transport. Which zones neighbour each other is assumed.
- Safe spots and hours: Security desk, main gate (8 am to 8 pm); Library counter (9 am to 6 pm).
- Eight sample tags and their answers: steel bottle `mountain sticker` (handover booked today), navy backpack `blue pen drive`, earbuds case `AK`, lab record `a cat`, steel lunch box `M`, grey hoodie (no unique mark), an ID card at the desk (matches Kabir's roll number), and an expired blue umbrella `yellow strap`.
- The demo people and roll numbers.

---

## 14. Known limits and next steps

**Limits of this build**
- No server: one browser holds all the data, so the "other side" of a case is seen by switching accounts in the demo bar.
- Sign-in codes are shown on screen, not emailed.
- Because everything is in one browser, the original photo sits in local storage even though the interface shows it only after verification.
- QR poster posting (F15) is not built.

**For a pilot** (the full list, with free ways to build each, is in [ROADMAP.md](ROADMAP.md); hosting is in [DEPLOYMENT.md](DEPLOYMENT.md))
1. A server with college-email OTP, bcrypt or argon2 for answers and codes, and the original photo released only to a verified owner.
2. The security office's agreement to be the handover point and keep the register.
3. Real zones, safe spots and hours for the campus.
4. A moderator for reports (security, a faculty coordinator or the student council).
5. The DPDP Act 2023 notice and consent, confirmed with the college.
6. QR posters at the library, canteen and bus stop.
