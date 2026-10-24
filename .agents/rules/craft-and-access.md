---
trigger: model_decision
description: "Apply when implementing or verifying layout, type, colour, imagery, motion, responsiveness, accessibility, forms or interactive parts. Positive craft standards and the honest-verification rules. Use it to check the build, not to limit the direction."
---

# Craft, Access, Verification

Design first, then hold the build to this floor. Impeccable found that reminding a model about accessibility while it chooses a direction makes it timid. So decide boldly, then verify strictly.

## Hierarchy and composition

- One dominant thing per screen. Name it before styling. Squint: the page should reduce to two or three masses.
- The first screen answers the visitor's first question in large type: what this is, and what to do.
- Text blocks share two or three left edges across the page. Equal outer margins. Asymmetry lives inside the grid.
- Gaps between sections are clearly larger than gaps inside them. More space above a heading than below.
- Neighbouring sections use different compositions. A card means a real, separable object.
- No stretch taller than half a screen holds nothing. One deliberate rest per page at most.

## Type

- Strong scale contrast: display roughly 4 times body or more; five sizes on a page at most.
- One family is normal; two is the limit, clearly different.
- Body 16 px or larger, 45 to 75 characters per line, leading about 1.5. Display leading 0.9 to 1.05, tracking 0 to -0.04em.
- Headlines: two lines or fewer at every width (about 32 characters is safe). Use `text-wrap: balance`.
- Load every font you name, with fallbacks. Confirm in the render, not the source.
- Proper punctuation: curly quotes, the ellipsis character, tabular figures for numbers that compare.

## Colour

- Pick a strategy first: restrained (tinted neutrals and one accent), committed (one colour holds 30 to 60 percent), full palette (3 to 4 named roles), or drenched (the surface is the colour).
- Choose light or dark from the scene: who uses this, where, in what light. Not from the category.
- Roles as tokens: ground, surface, ink, muted ink, line, accent, status. No literal colours past the token block.
- Contrast: 4.5:1 for body text, 3:1 for large text and UI parts, checked on the real background. On coloured grounds tint secondary text from the hue, never grey.
- Never colour alone for status.

## Imagery

- Order of preference: the human's own; a real screenshot or a built fragment of the real product; generated images if a tool is allowed; credited open-licence pictures of the subject's world; drawings made for this subject; type and colour alone.
- One decisive image beats six weak ones. Same crop ratios and treatment.
- Informative images get alt text; decorative ones get `alt=""`. Explicit width and height.

## Motion

- One authored moment, not scattered effects. Exponential ease-out, short durations, transform and opacity.
- Content is visible by default; reveals never leave blank bands if scripts fail.
- Honour `prefers-reduced-motion`. Never `transition: all`. Never animate width, height, top or left.

## Browser surfaces

Theme the parts nobody draws: `::selection`, `caret-color`, `accent-color`, focus rings, link underline offset, scrollbars. It is the cheapest signal that a page was built rather than assembled.

## Responsive

- Check about 1440, 768 and 390 px. No horizontal scroll anywhere. Use `overflow-x: clip`, `minmax(0, 1fr)` and `min-width: 0` where content can overflow.
- The phone layout is its own composition: its own crops and line breaks.
- Touch targets around 44 px. Long words and long labels survive.

## Accessibility baseline (verify after building)

- Landmarks, one H1, logical headings, `lang`, a real `<title>`, viewport meta.
- Every control reachable by keyboard with a visible `:focus-visible` style.
- Labels on inputs, errors next to fields, names on icon-only buttons, `aria-live` for async messages.
- Dialogs trap and restore focus and close on Escape.

## States and honesty of function

- Links navigate, buttons act. Loading, empty, error, success and disabled states exist where data or input exists.
- No fake backend. Without one, use clear front-end state or a `mailto:` with a written subject, and say so.

## Honest verification

- Run the scripts that exist in the project. Do not assume they exist.
- Open the rendered page. Source is not the page.
- Read the console and terminal output.
- If you cannot open a browser, say so and list what is unchecked.
- Never write "tested", "verified" or "no errors" about something you did not run.
