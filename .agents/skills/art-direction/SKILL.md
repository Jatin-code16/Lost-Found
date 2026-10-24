---
name: art-direction
description: Use at the start of any website, landing page, portfolio, poster, campaign, app screen or redesign, and whenever a design must not look AI-generated. Turns a brief into a specific direction through the human's own ideas, a subject inventory, wide divergent options with a random deal, three real directions, a human pick, and a token spec. Use before writing layout code.
---

# Art Direction

Goal: a design that could only belong to this brief, chosen by the human. Order matters: human input, then inventory, then wide options, then a choice, then tokens. Specs, not mockups, until the choice is made.

## Step 0: Mode

Say in one line which mode the surface is in. Choose from the surface, not the product.

- **Persuade**: the visitor decides and acts (landing page, campaign, event, pricing). Take risk with composition, type, imagery.
- **Experience**: the visitor is inside the work (portfolio, gallery, showcase). Let the work lead from the first screen.
- **Read**: the visitor understands something (article, docs, explainer). Structure for comprehension first.
- **Operate**: the visitor completes a task (dashboard, tool, form). Take risk with clarity: quiet surfaces, colour spent on data, strong states.

If an existing design system is in force, keep it and skip to Step 6.

## Step 1: Human input first (CP1)

Before you show any idea, get the human's raw material. Ask in one message, each item with a default:

1. **Material**: what real things exist? Photos, a product, numbers, quotes, names, a place.
2. **Their own ideas**: three, rough is fine. One opinion about how it should feel.
3. **Must not**: three things it must not look or sound like.
4. **The one action or feeling** the audience should leave with.

"Go" means infer, state the inferences in three lines, and continue. Facts are never inferred: a number, quote or logo not given stays absent.

## Step 2: Inventory

Write 8 to 12 items that belong to this subject and no competitor:

- Its name and what the name means; its place (street, city, landscape, weather, light, local signs and typefaces).
- Numbers the human gave (years, seats, minutes, prices). Never invent.
- The constraint it lives with (one batch a month, by appointment, closed in monsoon).
- Its materials, colours, objects, rituals, hours.
- The printed and painted things of its world: tickets, labels, menus, signs, forms.
- The audience and the moment they arrive (on a phone, in a hurry, sceptical, curious).
- Three anti-references.

Mark every assumed item "(assumed)".

## Step 3: Argument

List the page as claims with proof, one per section. The claims decide which sections exist and their order. A section with no claim is filler. This replaces the stock hero, logos, features, testimonial, pricing, CTA order.

```
1. It is ...                 -> proof: the thing itself, large
2. It is different because ... -> proof: ...
3. You can ...               -> proof: price, button
```

## Step 4: Diverge (CP2)

1. **Wide and cheap.** Think step by step, then list 10 one-line concepts, each with a rough probability that a model would produce it. Keep the low-probability ones that still fit the inventory. Discard the top two unless the human's own ideas point there.
2. **Seven worlds.** List seven concrete systems, artefacts, places or rituals the audience knows well (from the subject's culture, not the tools of the trade), spanning at least three material families. Note the page this category always ships and its predictable opposite: both are the rut.
3. **Deal.** Run `node .agents/skills/art-direction/scripts/deal.mjs` (add `--mode any` for non-web work). Fuse each dealt form with the brief: the form gives the grammar, the brief gives every fact. Print the seed.
4. **Idea sentence** for each candidate: "On this page, [something only this subject has] becomes [the device the form calls for]." Run the competitor test: swap in the nearest competitor. If it still works, the idea belongs to the category.
5. **Three directions.** One from the brief's own material, one from the deal, one deliberately quiet. They differ on at least three axes: type voice, palette strategy, layout topology, imagery source, motion posture, copy voice. For each:
   - Name and idea sentence
   - Palette: strategy plus 4 to 6 named roles with approximate hex values and where they come from
   - Type: the roles and the character wanted, with a brief-based reason (substitution test on every face)
   - First screen: an ASCII sketch, what is where, at what scale, where the action sits
   - The one live thing: one thing the visitor can do, or that differs per visit, made from the idea
   - Imagery and motion: what is used, what is left out
   - Gives up: one honest trade-off
6. **Recommend** one in two lines. Then stop and wait. Also offer the plain option: "the category standard, done very well", for a human who wants it. Never recommend that one yourself.

On autopilot, pick, write why, label it "agent-picked, not human-reviewed".

## Step 5: The picks block

After the human chooses, restate the decision once, compactly, so they can redirect cheaply:

```
Direction: <name>, from <source: brief / deal seed N / quiet>
Idea: On this page, ... becomes ...
Palette: <strategy>, <roles>
Type: <roles and character>
First screen: <one line>
Live thing: <one line>
Sections (argument order): ...
Human decided: ...   Agent decided: ...
```

## Step 6: Tokens

Write tokens before markup, as CSS custom properties or the project's own mechanism. One comment per group giving the brief-based reason.

- Colour roles: ground, surface, ink, muted ink, line, accent, status. Tinted neutrals.
- Type: families with fallbacks, a scale with strong contrast (five steps at most), weights, tracking.
- Space: a scale with tight groups and generous separation.
- Shape: one radius decision (square or fully round, chosen once), border policy, shadow policy (what you are not using).
- Motion: durations, easing, the one authored moment.
- Width and grid: container cap, columns, outer margins.
- Browser surfaces: selection, caret, focus ring, accent colour.

## Step 7: Skeleton first

Build the first screen with real content at desktop and phone width and look at it before building further. Then the sections in argument order, each a different composition from its neighbours. Carry the idea into every section, footer included.

## Traceability check

Before calling the work done, list each major choice next to the brief fact it comes from:

| Choice | Comes from |
|---|---|
| Display face | ... |
| Ground and accent | ... |
| Layout motif | ... |
| Imagery | ... |
| Live thing | ... |

A choice with no fact is a default. Replace it or state the functional reason.

## Anti-fixation

If the structure is still wrong after two rounds, return to Step 4 with one new constraint from the human, or deal again. Do not polish.
