---
name: critique-and-polish
description: Use after the first full render of a website, UI, poster or any visual piece, or when asked to review, critique, polish or improve one. Runs a screenshot-first critique (ideally by a fresh-context reviewer), a weighted score with caps, the scanners, fixes the top three problems, and rechecks for at most two rounds. Ends at the human review checkpoint.
---

# Critique and Polish

Judge the pictures, never your intentions. You wrote the code, so you will read your plans into it. The screenshots show only what is there.

## 0. Who reviews

Best: a fresh reviewer that has not seen the build conversation (a subagent with no forked history, or a new chat). Give it only the brief, the idea sentence, the screenshots and this file. Impeccable and Hallmark both run their finish review this way, because a reviewer that inherits your transcript inherits your optimism. If no fresh context exists, step out deliberately: reread the brief first, then look at the screenshots as a stranger, and say in the report that the review was single-context.

## 1. Capture

Screenshots at about 1440, 768 and 390 px, first screen and full page, from the top, with entrance motion settled. `render-check.mjs` writes these. Open every file and confirm it shows what its name claims (no blank bands, no half-loaded state). Do not critique from code alone; if you could not see the page, say the critique is code-based and incomplete.

## 2. Look (before any scanner output)

Fourteen quick passes, each on its own:

1. **One second, then five.** What did the eye land on? Can a stranger say what this is, who it is for and what to do?
2. **Squint.** Two or three large masses with clear size differences, or many medium ones?
3. **Cover the name.** Could the first screen belong to a competitor? Does the idea reach the last section, or turn into stock blocks?
4. **Edges.** Count distinct left edges. Two or three reused, or six placed one at a time?
5. **Space and frame.** Section gaps larger than inner gaps? Equal outer margins? Any accidental hole or half-empty section?
6. **Type.** Display at least three to four times body? Five sizes or fewer? Headlines two lines or fewer? Orphans? Measure under 75 characters?
7. **Colour.** Name the proportions. Is the accent on the action and maybe one detail, or everywhere?
8. **Images.** Real pictures doing a job, one treatment, shared ratios? Any grey box, fake screen or stretched photo?
9. **Sameness.** One word per section layout (split, list, full-bleed, statement…). The same word twice in a row is the template showing.
10. **Phone.** Its own composition, or the desktop squeezed?
11. **Fullness.** Every screen a composed poster, or a thin column with dead ground? A clean but thin page loses to a full one.
12. **Substance.** Does every section the brief asked for deliver its full content?
13. **Collisions.** Anything overlapping a headline or button, anything off the phone edge?
14. **Live thing and memory.** Name the one thing a visitor can do or will remember an hour later. If the honest answer is "a mood", the concept has not committed.

## 3. Score

Four criteria, 1 to 10, weighted like an Awwwards jury: **design 40%, usability 30%, creativity 20%, content 10%**.

- Design: 9 to 10 every screen holds as a poster; 7 clean, clear system, little tension; 6 tidy but anonymous; 5 or less weak hierarchy, default type.
- Usability: 9 to 10 what, who and what to do without scrolling, flawless on a phone; 7 one real problem; 6 or less you have to hunt.
- Creativity: 9 to 10 an idea specific to this subject you have not seen applied this way; 8 a clear idea with one memorable move; 7 tasteful known approach; 6 or less category default.
- Content: 9 to 10 every line could only be about this subject; 7 to 8 concrete with some generic lines; 6 or less slogans and filler.

`overall = 0.4 design + 0.3 usability + 0.2 creativity + 0.1 content`. Real Sites of the Day land around 7.5 to 8. If your first score for your own work is 9, score again as the juror who did not build it.

**Caps** (override the arithmetic):

- Any render-check FAIL: overall at most 6.0.
- Headline over two lines, an eyebrow, a decorative gradient, glow or resting shadow visible: overall at most 6.5.
- Could belong to a competitor (pass 3): creativity at most 6.
- No live thing: creativity at most 7.5.
- Fewer than four real pictures on an image-led page: design at most 6.5.
- Placeholder anything: content at most 5. A requested section missing or thin: content at most 6.
- No clear title on the first screen: usability at most 6. No primary action on the first screen: usability at most 7.
- Two or more mostly empty desktop screens, or grey small running text: design at most 6.5.

## 4. Scanners

Now run `slop-check.mjs` and `render-check.mjs` (see `slop-audit`). Add their findings to what you saw. Disagreements between your eyes and the tools are worth a sentence.

## 5. Write it down

```
ROUND n   (reviewer: fresh / single-context)
Seen in one second: …
Idea (one sentence): …
Live thing: …
Layout words by section: hero=… / …
Scores: design _ · usability _ · creativity _ · content _ → overall _._   Caps applied: …
Scanners: tier _, render FAIL _ WARN _
Top three problems (most visible first), each with its screenshot and the fix:
1. …
2. …
3. …
```

Name problems like a designer to a colleague: "the paragraph starts 40 px left of the headline's edge", not "could be more polished".

## 6. Fix the top three, in this order

1. The idea (if pass 3 fails, change the concept, not the details).
2. Hierarchy: one dominant element per screen.
3. Composition: edges, spacing, section variety, holes.
4. Type: scale contrast, line breaks, measure.
5. Imagery. 6. Colour proportion. 7. States and detail. 8. Motion last.

Prefer token changes over one-off patches. Never fill a removed ornament's gap with another ornament.

## 7. Recheck, then stop

Re-render, rescore, compare with the last round. Two rounds in the build thread; a third goes to the human. If round two still scores under 7.5, say so plainly with the remaining problems. Do not round up.

## 8. Human review (CP3)

Show the human the screenshots, the two rounds of scores, what is left, and at most one question. Apply their corrections first. Do not call the work finished until they have seen it, unless they said autopilot; then say so in the summary.
