---
description: Step 3. Build the chosen direction in order: picks block, tokens, copy deck, first screen, sections in argument order, the live thing, details. Then a first look and the scanners.
---

# /arena-build

Build only the direction the human chose (or the labelled agent-picked one).

1. Print the picks block (art-direction Step 5) so the human can redirect cheaply.
2. Tokens first, one comment per group with the brief-based reason: colour roles, type scale, spacing, one radius decision, shadow policy, motion, container and grid, browser surfaces (selection, caret, focus).
3. Copy deck as plain text before markup (copy-voice skill). Headlines two lines or fewer, about 32 characters.
4. First screen only, at desktop and phone width, with real content. Look at it before going on.
5. Sections in argument order, each a different composition from its neighbours, the idea carried into every one, footer included. Full content, no thin sections.
6. The one live thing, working on a phone with a thumb, with a plain fallback.
7. Imagery, one authored motion moment, states, semantics.
8. Traceability table: each major choice next to the brief fact it comes from. Replace any choice with no fact.
9. Save a known-good copy (git commit or zip).
10. Run `node .agents/skills/slop-audit/scripts/slop-check.mjs .` and, if Playwright is available, `node .agents/skills/slop-audit/scripts/render-check.mjs <entry>`. Report honestly what ran.
