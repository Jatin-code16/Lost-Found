---
description: Step 2 (CP2). Diverge wide in cheap text, sample from the tails, deal random forms, present three genuinely different directions as specs, recommend one, and wait for the human.
---

# /arena-diverge

Use the human's input and the inventory from /arena-brief. Follow the art-direction skill, Step 4.

1. Think step by step, then list 10 one-line concepts, each with a rough probability that a model would produce it. Mark the two most probable as "the rut". Keep low-probability ones that still fit.
2. List seven concrete worlds the audience knows by heart, from at least three material families.
3. Run `node .agents/skills/art-direction/scripts/deal.mjs` and print the seed and the dealt forms.
4. Fuse and filter: for each candidate write "On this page, [something only this subject has] becomes [the device]". Run the competitor test on each.
5. Present three directions: one from the brief's material, one from the deal, one quiet. They differ on at least three axes. For each: name, idea sentence, palette strategy and roles with hex values and sources, type roles with a brief-based reason, ASCII sketch of the first screen, the one live thing, imagery and motion policy, what it gives up.
6. Substitution test on every font and colour. Change any that are the usual alternative to a banned default.
7. Recommend one in two lines. Offer the "category standard, done very well" option without recommending it.
8. Stop and wait. On "autopilot", pick, explain, and label it "agent-picked, not human-reviewed".
