# Roadmap: future add-ons

The current build is a front-end demo: every screen and rule works, but all data stays in one browser. This roadmap turns it into a campus pilot and then grows it. Each add-on says **why** (usually a line in the PRD) and a **free way** to build it.

Free tiers change over time and some ask for a card on file even when you are not charged. Check the provider's current terms before you rely on one.

---

## Phase 1: pilot essentials (make it real)

These are needed before real students use it. Together they replace `localStorage` with a shared, secure backend.

| Add-on | Why | Free way to build it |
|---|---|---|
| Shared database for posts, claims, chats and the register | Today each browser has its own copy; finder and owner must see the same data | Supabase free tier (Postgres) |
| Real college-email OTP sign-in | PRD F1: only college addresses can sign in; today the code is shown on screen | Supabase Auth email OTP, limited to the college domain; a free transactional-email tier for higher volume |
| Server-side hashing of answers and codes | PRD NFR: bcrypt or argon2; browser SHA-256 is a demo stand-in | Postgres `pgcrypto` (`crypt()` with bcrypt) inside a database function, so the hash never leaves the server |
| Protected photo storage | PRD: "the original photo is never sent to a non-verified user" | Supabase Storage with row-level security: the blurred copy is public, the original is readable only by the finder, the verified owner and the desk |
| Real-time masked chat | Messages should arrive without a reload | Supabase Realtime |
| Server-side contact filter and rate limits | The browser filter can be bypassed; 3 tries a day must hold on the server | A database function or a Supabase Edge Function |
| Roles and moderation | PRD open question: who moderates (security, faculty, student council) | A `role` column with row-level-security policies for `desk` and `moderator` |
| Privacy notice and consent | PRD risk: DPDP Act 2023 notice and consent rules | A consent step at first sign-in; deletion jobs for chat (30 days) and the register (one academic year) |
| Real campus data | PRD open questions: zones, safe spots, hours, email domain | Edit `ZONES`, `NEIGHBOURS`, `SPOTS` and `COLLEGE_DOMAIN` in `assets/store.js`, then move them into a settings table |

---

## Phase 2: from the PRD's later list

| Add-on | Why | Free way to build it |
|---|---|---|
| QR notice-board posters (PRD F15) | Post a found item without signing in, then hand it to the desk; the PRD's answer to low adoption | Generate QR codes in the browser with a small open-source library; a short "walk-in" form that creates a desk-held item |
| Printable tag labels for the desk | The desk can tie a real paper tag with the same serial to each held item | A print stylesheet on the desk dashboard; QR code of the tag link |
| Second question for valuables | PRD risk: secret questions too easy to guess | A second question and hash; both must match |
| Graduation and account closure | PRD edge case: a leaving student's open items move to the desk | A scheduled job that closes accounts after the final semester |
| Weekly expiry batch for the desk | PRD risk: the desk lacks time | A weekly summary of expired items with one-tap decisions |
| CSV export of the register | Proof of who collected what, for disputes and audits | Client-side CSV download from the desk dashboard |

---

## Phase 3: smarter and faster

| Add-on | Why | Free way to build it |
|---|---|---|
| Push notifications for match alerts | PRD goal: an owner learns of a match without checking every day | Web Push with VAPID keys (no paid service needed), sent from a Supabase Edge Function |
| Offline posting queue | PRD NFR: posting works offline and syncs later | Store the draft in IndexedDB; send it when the connection returns (Background Sync where supported) |
| Better text matching for *Other* items | Today two *Other* items match only on a shared word | Simple synonyms (charger and adapter, bottle and flask); fuzzy matching in Postgres with `pg_trgm` |
| Photo similarity matching | PRD: "AI image matching (later)" | A small image model running in the browser (for example TensorFlow.js with MobileNet) that compares blurred photos. Needs a privacy review first. |
| Success-metrics dashboard | PRD metrics: recovery rate, time to recovery, contact leaks (target 0), false-claim rate, finder effort (under 60 s) | Queries on the register; posting time is already recorded per post (`postSeconds`) |

---

## Phase 4: polish and reach

| Add-on | Why | Free way to build it |
|---|---|---|
| Screen-reader audit | Keyboard and contrast are checked; a screen reader has not been tested | NVDA (free, Windows) and VoiceOver (built into iPhone and Mac) |
| Real-device testing | Only simulated phones and cameras were tested | A few students' own phones during the pilot |
| PNG app icons and a splash screen | Some phones ignore SVG icons when installing | Export PNG sizes from `assets/icon.svg` and add them to the manifest |
| Optional language packs | Only if the college asks; the current build is English only by decision | Move UI strings into one dictionary file per language |
| Dark theme | Evening use outside the library | A second set of colour tokens under `prefers-color-scheme: dark` |
| One-tap share into existing groups | PRD adoption plan: share a post's link (no contact) into the WhatsApp group | Already built with the Web Share API; add a pre-filled message per category |
| College single sign-on | Fewer codes to type if the college has SSO | Supabase Auth with the college's identity provider, if it offers one |

---

## Not planned (PRD non-goals)

These were left out on purpose and stay out unless the PRD changes:

- payments or rewards (a thank-you note is the reward);
- native Android or iOS apps (the web app is installable);
- GPS tracking or Bluetooth tags;
- use across several campuses.

---

## How to pick the next step

1. **Demo or class project:** nothing is required. The current build shows every principle.
2. **Small real pilot (one department):** Phase 1 in full, plus QR posters from Phase 2.
3. **Whole campus:** Phases 1 and 2, push notifications and the metrics dashboard from Phase 3, and the audits from Phase 4.
