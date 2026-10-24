<!-- slop-check:ignore-file -->
# Prompt Templates (websites and UI)

Fill every bracket with real material. The more of the brief's own words, names and numbers you paste in, the less the model fills gaps with averages. Keep each prompt in a numbered log; it doubles as your process evidence.

## 0. Kick-off (paste once, with your paper notes)

```text
Read AGENTS.md and .agents/rules/. Use the skills in .agents/skills/ when they apply.
We work in checkpoints: I give input, I choose a direction, I review. Do not write code until I have chosen a direction, unless I say "autopilot".

Challenge, exactly as given:
[paste]

My notes, written before using any AI:
- My three ideas: [1] [2] [3]
- One true detail only I know: [detail]
- Must not look or sound like: [a] [b] [c]
- The one thing a visitor should do or feel: [action]
- Real material I have: [photos / numbers / names / none]

Run /arena-brief now.
```

## 1. Diverge

```text
/arena-diverge.
First think step by step about the audience and the inventory. Then list 10 one-line concepts, each with a probability (0 to 1) of how often a model would produce it. Mark the two most probable as "the rut".
Run deal.mjs and show the seed and the forms.
Then give me three directions as specs, not code: one from my material, one from a dealt form, one quiet. They must differ on at least three of type voice, palette strategy, layout topology, imagery source, motion posture, copy voice.
For each: idea sentence ("On this page, X becomes Y"), palette roles with hex and where each comes from, type roles with a reason from my notes, an ASCII sketch of the first screen, the one live thing, and what it gives up.
Recommend one, then stop.
```

## 2. Pick or mix

```text
Go with [A / B / C]. Keep [element] from [other]. Cut [element] because [reason]. Add this constraint: [one constraint]. Print the picks block, then run /arena-build.
```

None fit:

```text
None of these. What is wrong: [one sentence]. Give me three new directions that avoid it and change at least two axes from last time. Roll a new deal.
```

## 3. Build

```text
/arena-build. Tokens first with a brief-based comment per group. Then the copy deck as plain text. Then only the first screen at desktop and phone width; show it to me before building more. Headlines two lines or fewer.
```

```text
Continue: the sections in argument order, each a different composition from its neighbours, full content, the one live thing working on a phone. Then the traceability table and the scanner results. Do not call anything tested unless you ran it.
```

## 4. Review

```text
/arena-review. If you can, give the review to a fresh subagent with only the brief, the idea sentence, the screenshots and the critique skill. Describe what you see before judging. Score with the caps. Then run the scanners. Fix only the top three problems, preferring token changes. Show before and after.
```

## 5. De-slop without swapping defaults

```text
The audit flagged [rules]. For each, tell me whether it is a reflex or a decision. For reflexes, propose a replacement that traces to my notes, never the usual substitute (eyebrow to 01/02/03, purple to emerald, cream to near-black). Show me the replacements before applying. Fill any gap with substance, not ornament.
```

## 6. Fixation breaker

```text
The structure is wrong and polishing will not fix it. Keep the tokens and the copy deck. Roll a new deal. Give me two different compositions for the first screen and the scroll as ASCII sketches. I will pick one.
```

## 7. Make it fuller, not fancier

```text
The page reads thin. Do not add decoration. Make the main thing larger, give one section a full field of colour, write every section's full content, and put a real picture or a built product fragment where a box is. Then show me.
```

## 8. Human signature pass

```text
I am writing these myself. Apply them exactly:
- Headline: [text]
- First sentence: [text]
- Button: [text]
- One line only I could write: [text]
Check they fit two lines at 390 px. Suggest at most one cut. Do not rephrase my voice.
```

## 9. Freeze

```text
/arena-freeze. No new features. Fix blockers only. Run the build, slop-check and render-check and paste the summary lines exactly. Write the process note from docs/PROCESS-NOTE.md with my decisions separated from yours.
```

## Tips that apply to every prompt

- Give real material, not adjectives. "Bamboo split on the shop floor since 1971" beats "authentic and warm".
- Ask for options before output, and for probabilities with the options.
- Ask the model to say what it assumed.
- Change one thing per revision and say what you are keeping.
- When it says "done", ask what it did not check.
