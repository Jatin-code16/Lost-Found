---
trigger: always_on
description: "How the human and the agent split the work: human ideas first, cheap divergent options, a human pick, honest feedback handling. Applies to every creative task, web or not."
---

# Human in the Loop

## Why the order matters

- **AI help makes people's work more alike.** Doshi and Hauser (Science Advances, 2024; 300 writers, 600 judges): one AI idea made stories 8 to 9 percent more novel and useful, but the stories were also 10.7 percent more similar to each other. A 2026 meta-analysis (de Rooij and Biskjaer; 19 studies, 61 effect sizes) found a small, robust homogenisation effect (d = 0.334). It was stronger on constrained tasks, and arena challenges are constrained tasks.
- **Models agree with each other.** Infinity-Chat (Jiang et al., NeurIPS 2025 best paper; 26K open-ended prompts) found that different models give strikingly similar answers. Your competitors get your defaults.
- **The first output anchors people.** Wadinambiarachchi et al. (CHI 2024, N = 60): AI images during ideation raised fixation and lowered the number, variety and originality of ideas. Wen et al. (2025, N = 24) found a tool with separate divergent and convergent modes beat a plain chatbot on creativity.
- **Help now can cost skill later.** Kumar et al. (2025, N = 1,100): LLM help raised creativity during the task but could lower people's performance when they later worked without it.
- **Trust lowers scrutiny.** Lee et al. (CHI 2025, 319 knowledge workers): more confidence in GenAI went with less critical thinking, and more self-confidence went with more. The human's job shifts to checking, merging and stewarding.
- **Frictionless generation produces the average.** Shin et al. (2026) argue for "productive friction" in web vibe coding: negotiate intent, show alternatives, anchor in context. This is a framework, not yet a tested result.

Taken together: the human thinks first, the AI widens the field, the human chooses, and the human checks.

## CP1: ask

- The human writes raw input before you show anything: three ideas of their own (bad ones count), one opinion, one true detail, one anti-reference. If they want to skip, take "go" as consent and state your assumptions in three lines.
- At most three questions, each with a default. Ask only what you cannot find in the brief, the files or the repo.
- Good questions: What is the one detail only this has? What must it not look or sound like? What should the audience do or feel? What real material exists (photos, numbers, quotes, a product)?
- Never ask for CSS values or style lanes ("modern or classic?"). Ask about the subject.

## CP2: show options

- **Diverge wide in text, cheap.** Generate 8 to 12 one-line ideas first, with a rough probability for each ("how often would a model give this?"). Keep the low-probability ones that still fit. This is Verbalized Sampling (Zhang et al., 2025), which raised creative-writing diversity 1.6 to 2.1 times. Reason step by step before listing: chain-of-thought prompting gave the most varied ideas in Meincke et al. (2024).
- **Break your own ranking.** Run `node .agents/skills/art-direction/scripts/deal.mjs` and let the dealt forms seed at least one direction. Your own top pick is usually the category default.
- **Present three directions** that differ on at least three axes: type voice, palette strategy, layout topology, imagery source, motion posture, copy voice. One from the brief's own material, one from a dealt non-web form, one quiet. Each with a name, idea sentence, decisions with reasons, ASCII sketch of the first screen, the one live thing, and what it gives up.
- **Specs, not mockups.** Polished previews cause fixation. Do not build all three.
- Recommend one in two lines. The human may override, mix ("A's layout with C's colours") or reject all. If they reject all, ask what is wrong in one sentence, then change at least two axes.

## CP3: take feedback

- The human's taste correction beats your rubric.
- Make the smallest change that satisfies it. Do not "improve" other areas.
- Turn vague feedback ("make it pop") into one concrete change and say what you changed.
- If you disagree, say so once, briefly, then do what they decided.
- When revising, say what you keep and what you change.

## Anti-fixation

- Do not polish the wrong structure. After two rounds on the same problem, propose a different approach.
- If a direction fails, return to the dealt list rather than to your favourite.

## Honesty

- Flag assumptions, guesses and anything unchecked.
- Make correction cheap: name the file, token or line the human can change themselves.
- Keep a short decision log (who decided what). It becomes the process note.
