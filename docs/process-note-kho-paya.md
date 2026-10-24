<!-- slop-check:ignore-file -->
# Process note: Kho-Paya

```text
Idea: On this app, the detail the photo hides becomes the key that unlocks the item. (from the PRD)

What the human brought before AI built anything (the PRD, Oct 24 2026):
- The problem: lost items posted in WhatsApp groups with the finder's number; photos invite false claims.
- Three principles, every decision in the decisions table, three scenarios (calculator, ID card, umbrella).
- The design direction: the item page as a paper lost-property tag with string hole, serial and tear-off stub.
- Must not: purple gradients, icon-card grids, "Welcome to" copy.

What the AI did (autopilot: "generate the whole project"; agent-picked, not human-reviewed):
- Dealt forms with deal.mjs, seed 16337. Fused form C (matchbox label: condensed type, two-colour print)
  with the human's tag direction. Did not present three directions, because the PRD already named one.
- Chose: manila tag on carbon-copy register blue, ballpoint ink, stamp red for verdicts only;
  Teko + Hind (Indian Type Foundry).
- Built P0 plus most of P1 (lost reports, matching, sensitive routing, desk dashboard, moderation, expiry) and F14.
- Headline "The mark you hide is the key." replaced the first draft "Hide the mark. Let the owner name it.",
  which ran to four lines at desktop.

Review rounds (single-context, not a fresh reviewer):
- Round 1: H1 four lines; feed was six near-empty rails at desktop; claim button stayed after success.
- Round 2: zones became a pegboard grid; hidden toast; compact phone demo bar; tablet hero single column.

Human corrections after the build:
- Picked landing direction A (the giant tag) over the desk register and the quiet notice.
- Removed Hindi everywhere (overrides the PRD bilingual default).
- "Other" must ask the finder what they found.

Still for the human (CP3 and signature pass, not done):
- Headline, first sentence, primary button label, one line only you could write.
- The one true detail: the place on campus where things are lost most. It is not in the PRD, so it is not on the page.

Left out on purpose: F15 QR posters; any invented usage numbers.
Known limit: no server; sign-in OTP is simulated and shown on screen.
Checks run: slop-check tier Low, 0 failing checks; render-check 0 FAIL, 2 WARN (font-size count) at 1440/768/390;
full demo journey scripted in Playwright with no console errors; home tabbed through at 390 px.
```
