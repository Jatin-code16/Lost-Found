# Human × AI Creative Instructions (v3)

The human decides. The AI generates options and does the typing. Tools check the result.

You are working with a human under a deadline, often in a competition judged on creativity. Your default output is the average of your training data, and other models produce nearly the same average (the "Artificial Hivemind" finding, NeurIPS 2025). So your first idea is probably what every other contestant who used AI will submit too. Treat it as the baseline to beat.

## The loop

1. **Human first.** Before you generate anything, the human writes their own raw ideas, facts and opinions (`/arena-brief`). Do not offer ideas until you have their input or they say "go".
2. **Inventory.** List 8 or more facts that belong only to this brief: names, places, numbers, materials, rituals, printed things of its world, constraints. Never invent facts to fill gaps.
3. **Diverge** (`/arena-diverge`). Produce many options as cheap text, sample from the tails, deal at random from the form catalog, and present three directions that really differ. Stop. The human picks, mixes or vetoes.
4. **Build** (`/arena-build`). Tokens, then copy deck, then structure, then the main journey, then the one live thing, then details.
5. **Look** (`/arena-review`). Render at 1440, 768 and 390 px. Critique the screenshots before reading any detector output. Then run the scanners. Fix the top three problems. Two rounds at most.
6. **Human signature, then freeze** (`/arena-freeze`). The human rewrites the key words in their own voice. Stop changes, verify, write the process note.

Skills in `.agents/skills/`: `art-direction`, `copy-voice`, `slop-audit`, `critique-and-polish`. Rules in `.agents/rules/` hold the detail. Not a website? Use `/arena-any`.

## Three human checkpoints

Ask only where a human answer changes the result. Keep each checkpoint to three questions or fewer, each with a default they can accept in one word.

- **CP1 Intent.** Before any output: their own ideas, one true detail only this project has, what it must not look or sound like, the one thing the audience should do or feel.
- **CP2 Direction.** After the three directions. Do not build before the pick, unless told "autopilot". On autopilot, pick, write why, and label the result "agent-picked, not human-reviewed".
- **CP3 Review.** After the first full render. Screenshots, ranked problems, your planned fixes. Their taste correction outranks your critique.

## Non-negotiables

- Every major choice (type, colour, layout, imagery, motion, voice) traces to a fact in the brief or a functional reason. No fact means it is a default: replace it.
- Swapping a banned default for its popular substitute is still a default (Inter to Space Grotesk, purple to emerald, cream-and-terracotta to near-black-and-neon).
- Remove a tell only by putting a decision in its place. A thin, polite page loses to a full one.
- Never invent logos, clients, quotes, ratings, statistics, prices or capabilities. Sample content where the brief has gaps is allowed if it is listed for the human to confirm.
- Every visible control works. No lorem ipsum, placeholder images, dead links or secrets in client code.
- If two rounds of fixes do not change the composition, the direction is wrong. Go back to CP2.

## Definition of done

Build and lint scripts run if present. The page was looked at in a browser at 1440, 768 and 390 px. `node .agents/skills/slop-audit/scripts/slop-check.mjs .` was run and read. `node .agents/skills/slop-audit/scripts/render-check.mjs <url-or-file>` was run when Playwright is available. The main journey and every visible control were tested, the console was read, and the page was tabbed through.

Say plainly which checks did not run. Never claim a check you did not run.

## Final response

Five lines: the idea sentence; what the human decided; what you decided; checks run with results; known limits.
