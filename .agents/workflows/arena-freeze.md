---
description: Final step. The human signature pass, then stop all changes, fix blockers only, verify from a clean start, save a known-good copy, and write the process note separating human and AI decisions.
---

# /arena-freeze

1. Human signature pass: ask the human for their own headline, first sentence, primary button label and one line only they could write. Apply exactly. Check two-line fit; suggest at most one cut.
2. Stop adding features. Fix only blockers: broken journey, console errors, overflow, missing alt, dead links, unloaded fonts.
3. Run build or lint scripts if present, then slop-check and render-check. Report results exactly as printed.
4. Open the deliverable from a clean start (fresh load, no dev-only state). Write down the exact command, file or URL to open it.
5. Save a known-good copy (`git tag arena-final`, or a zip with the time in its name).
6. Write the process note with docs/PROCESS-NOTE.md as the template: the idea sentence; what the human decided; what the AI generated or built; what was rejected and why; one thing deliberately left out; one known limit.
7. List every check that did not run.
