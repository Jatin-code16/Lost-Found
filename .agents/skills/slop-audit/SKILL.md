---
name: slop-audit
description: Use to check a website or UI for AI-default design and copy tells (default fonts, purple or cream-and-terracotta palettes, eyebrow labels, middle-dot meta strings, glued arrows, 01/02/03 markers, gradient text, glass, icon-card rows, filler copy, em-dash glue) and for accessibility and rendering problems (overflow, long headlines, unloaded fonts, contrast, focus). Run after the first build, after fixes, before freezing, and when asked whether something looks AI-made.
---

# Slop Audit

Two deterministic tools, no model judgement. Run them after your own screenshot critique, not before: a detector's list anchors judgement (Impeccable runs its design review and its detector in separate contexts for this reason).

## 1. Source scan (always available, Node 18+, no dependencies)

```
node .agents/skills/slop-audit/scripts/slop-check.mjs .
node .agents/skills/slop-audit/scripts/slop-check.mjs src --json
node .agents/skills/slop-audit/scripts/slop-check.mjs . --strict     # exit 1 on High tier
node .agents/skills/slop-audit/scripts/slop-check.mjs . --quiet      # summary only
```

Scans `.html .css .scss .js .jsx .ts .tsx .vue .svelte .astro .md`; skips `node_modules`, build output, `.agents`, `.claude`.

Finding kinds:

- **tell**: AI-default design pattern (wave 1, 2 and 3 in `rules/anti-slop-floor.md`).
- **copy**: generated-prose pattern.
- **check**: accessibility or robustness gap. Fix these.
- **note**: context-dependent. Look at the page, then decide.

Tier counts distinct tell and copy rules: Low 0 to 1, Medium 2 to 3, High 4 or more. The tiering follows Adrian Krebs's 2026 analysis of about 1,590 Show HN pages (16 deterministic checks, author-estimated 5 to 10 percent false positives).

Opt out per file with a comment `slop-ok:<rule-id>` next to the reason. Skip a file with `slop-check:ignore-file`.

## 2. Render check (needs Playwright)

```
node .agents/skills/slop-audit/scripts/render-check.mjs index.html
node .agents/skills/slop-audit/scripts/render-check.mjs http://localhost:5173 --strict
node .agents/skills/slop-audit/scripts/render-check.mjs index.html --widths 1440,390 --out .slop-check/render
```

Opens the page at 1440, 768 and 390 px, scrolls it to trigger reveals, and measures: horizontal overflow and its cause, H1 and heading line counts, fonts declared but not loaded, text contrast against the real background, text on images, tiny text, tracked-caps labels, number of font sizes, share of centred text, broken images, missing alt, focus visibility, small touch targets, an action in the first screen, dead links, console errors. Screenshots go to `.slop-check/render/` as `<width>-fold.png` and `<width>-full.png`.

No Playwright? `npm i -D playwright && npx playwright install chromium`, or take screenshots with any browser tool and say render-check did not run.

## What to do with findings

1. Open the code and the screenshot. Decide: reflex or decision?
2. Reflex: replace it with a choice that traces to the brief. Never with the popular substitute (eyebrow to 01/02/03, purple to emerald, cream to near-black).
3. Decision: keep it, add `slop-ok:<id>` with the reason, and mention it in the summary.
4. Removing a tell leaves a gap. Fill it with substance: scale, a colour field, a real picture, full content.
5. Re-run both tools. Report before and after tiers and FAIL counts, and anything kept on purpose.

## Limits

- Pattern matching gives false positives and misses. The source scan sees no pixels; the render check sees no taste.
- Tailwind and CSS-in-JS are only partly visible to the source scan.
- Contrast on images and gradients cannot be measured; check by eye.
- Low tier and 0 FAIL mean only that these patterns were not found. A page can pass both and still be the category average. Use `critique-and-polish` for that.
