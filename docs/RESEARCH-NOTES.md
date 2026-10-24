<!-- slop-check:ignore-file -->
# Research Notes (v3)

What was read to rewrite this kit, what was taken from each source, and how much weight it deserves. Compiled 24 October 2026. v2 could read only the READMEs of the main skills; v3 read their full skill files from GitHub. Where a figure comes from a press release or abstract rather than the paper body, that is said.

## 1. Design skills for coding agents (read in full from source)

**Anthropic, frontend-design skill** (github.com/anthropics/skills).
Took: ground the design in the subject's materials and vernacular; plan tokens (4 to 6 hex colours, type roles, ASCII layout) and review the plan against the brief before code ("work through a similar prompt to see if you arrive somewhere similar"); spend boldness in one place; single orchestrated motion moment; copy as design content. Most important: its calibration list of where AI design now clusters: cream ground with high-contrast serif and terracotta (near #F4F1EA and #D97757, Claude's own accent), near-black with one acid-green or vermilion, broadsheet hairlines, the SaaS card kit, and template chrome (eyebrows, middle-dot strings, "WORD — fragment", mono labels, glued arrows).
Weight: first-party, practical, short. A prompt, not a tested method.

**Impeccable v4.7 (Paul Bakaus)** (github.com/pbakaus/impeccable): SKILL.md, craft-floor, new-work, shape, critique.
Took: four modes (Persuade, Operate, Read, Experience) chosen per surface; the craft floor (contrast, offset shadows, measure, one authored motion, themed browser surfaces as "the cheapest signal a page was built rather than assembled"); seven candidate worlds from the audience's culture spanning three material families; a random concept roll so the ranking rut cannot win, with the user keeping the choice and a "standing exit" to the category standard; the extended second-wave font list; design review and detector run in isolated contexts because detector output anchors judgement; a fresh-context finish reviewer that does not inherit the build transcript; accessibility checked at audit time because reminders at design time make models timid; "prove, don't claim" with synthetic demonstration data labelled and commercial claims never invented.
Weight: the most developed public skill; opinionated. Its maintainers report blind ratings internally; not independently verified.

**Taste Skill v2 (Leonxlnx)** (github.com/Leonxlnx/taste-skill): SKILL.md, tells, critique, research, copy.
Took: the 8 to 12 item subject inventory; the argument (claims with proof decide sections); the idea sentence "On this page, X becomes Y" and the competitor test; "one live thing"; headline arithmetic (two lines, about 32 characters); the dated tells registry (three waves, and "the avoidance aesthetic"); the 14-pass critique, Awwwards weighting (40/30/20/10) and score caps; fullness over restraint.
Numbers used: from its study of 247 gallery sites (One Page Love and Awwwards Sites of the Day, October 2026): icon feature cards 1% of top vs 28% of weak sites; tiny tracked caps 16% vs 57%; gradients 22% vs 52%; centred statement over media as hero 7% vs 24%; median hero headline 5 words, 32 characters. In its own blind tests a richer page with tells beat a thin clean page.
Weight: the scores come from 21 model reviewers judging screenshots, not human jurors. Useful direction, not ground truth.

**Hallmark v2 (Nutlope)** (github.com/nutlope/hallmark).
Took: a single "ask once" message covering material, audience, use and tone, where "go ahead" means infer and state; the picks block as the user's redirect window; the mirror test; no invented metrics, testimonials or logo walls; about 80 words per screen; fresh-context finish review.
Weight: practical, opinionated.

**avoid-ai-design (funboy322)** (github.com/funboy322/avoid-ai-design).
Took: first- and second-order defaults, the emerald fallback, fake window chrome, declared-but-not-loaded fonts, and the forecast of a third, handmade "anti-AI" wave.
Weight: a careful catalogue built on Krebs and Anthropic; not independent evidence.

**Vercel Web Interface Guidelines** (github.com/vercel-labs/web-interface-guidelines).
Took: concrete floor items: `:focus-visible`, never `transition: all`, curly quotes and ellipsis, tabular numbers, `text-wrap: balance`, image dimensions, `aria-live`, safe areas.

**UI UX Pro Max** (nextlevelbuilder): a searchable database of styles and palettes. Not adopted: a style library is another place for defaults to come from. Noted for completeness.

## 2. What AI-looking sites share

**Adrian Krebs, scoring Show HN landing pages (2026).** Headless browser, 16 deterministic CSS and DOM checks, no model judging, roughly 1,400 to 1,600 pages depending on the write-up; about one in five hit four or more patterns. Author estimates 5 to 10% false positives. Took: deterministic checks and the Low, Medium, High tiering.
Weight: careful blog analysis, not peer reviewed; the sample skews toward solo, AI-built projects.

## 3. Homogenisation, fixation and human-in-the-loop research

**Doshi and Hauser, Science Advances (2024).** 300 writers, 600 judges, short stories. With AI ideas, stories were rated up to 8.1% more novel and 9% more useful, with the largest gains for less creative writers; stories using AI ideas were 10.7% more similar to each other. (Figures from the university press release.) Took: individual gain, collective loss. Your edge is the part the AI cannot make similar.

**de Rooij and Biskjaer, meta-analysis (ECCE 2026; Behaviour and Information Technology, 2026).** 19 studies, 61 effect sizes: a small, significant homogenisation effect of AI use (d = 0.334), robust to sensitivity analyses and publication bias, stronger in semantically constrained ideation tasks. Took: competition briefs are constrained tasks, so the risk is higher there.

**Jiang et al., "Artificial Hivemind" (NeurIPS 2025 Datasets and Benchmarks best paper).** Infinity-Chat, 26K open-ended queries, 31,250 human annotations. Strong repetition within a model and even stronger similarity across different models. Took: competitors using other models will still converge on your defaults.

**Zhang et al., "Verbalized Sampling" (2025; ICML 2026).** Training-free prompting: ask for several responses with their probabilities. Creative-writing diversity rose 1.6 to 2.1 times over direct prompting, with no loss in factual accuracy or safety; lowering the probability threshold increases diversity; more capable models benefit more. Took: the "10 ideas with probabilities, drop the rut" step.

**Meincke, Mollick and Terwiesch, "Prompting Diverse Ideas" (2024).** Chain-of-thought prompting gave the most diverse and most unique GPT-4 ideas of the strategies tested, close to groups of humans. Took: "think step by step, then list".

**Wadinambiarachchi et al., CHI 2024 (N = 60).** AI images during visual ideation raised fixation on the first example and lowered fluency, variety and originality. Took: specs not mockups before the choice; restart rather than iterate on a wrong first output.

**Wen et al., "Exploration vs. Fixation" (arXiv 2512.18388, 2025; N = 24).** A co-creation tool with separate divergent and convergent modes (grounded in the Geneplore model) beat ChatGPT on several creativity and usability measures. Took: separate the diverge step from the converge step.

**Kumar et al., "Human Creativity in the Age of LLMs" (2025; N = 1,100, two pre-registered experiments).** LLM help raised creativity during assisted tasks but may hinder later unassisted performance. Took: human ideas first, every time.

**Lee et al., CHI 2025 (Microsoft Research; 319 knowledge workers).** Higher confidence in GenAI went with less critical thinking; higher self-confidence with more. Effort shifts to verification, integration and stewardship. Took: the human checks and signs; the agent must never claim unrun checks.

**Shin et al., "Interrogating Design Homogenization in Web Vibe Coding" (arXiv 2603.13036, 2026).** Argues frictionless generation pushes people to the average and proposes productive friction: negotiate intent, show alternatives, anchor in context and culture. Took: the checkpoints and the use of local culture as a source. Weight: conceptual; the authors leave empirical tests to future work.

**Amershi et al., "Guidelines for Human-AI Interaction" (CHI 2019).** Took: make clear what the system can do and how well, support efficient correction, scope behaviour when uncertain.

## 4. Competition format

No public page described this specific arena. Similar prompt contests judge clarity and structure of prompts, creativity and originality, relevance of output, use of constraints and ethical use, and some add an "AI or human?" round (for example the AI Kshetra PromptCraft rules). The playbook therefore prepares for prompts, process and output all being judged.

## 5. What is evidence and what is judgement

Evidence-backed:
- AI help homogenises output, more so on constrained tasks; models converge across vendors.
- Asking for distributions and step-by-step reasoning measurably raises idea diversity.
- Early polished AI output causes fixation; separating diverge from converge helps.
- Human ideation first protects later independent performance.
- Deterministic checks are cheap and catch real patterns, with false positives.

Practitioner consensus (several skills agree, not formally tested):
- Ban lists decay; procedures beat lists; second- and third-wave tells.
- Fresh-context review beats self-review.
- Substance beats restraint; one live thing; one authored motion moment.

Judgement in this kit, not proven:
- The exact checkpoints, the dice catalogue, the 120-minute schedule, the caps and thresholds.

Rehearse once and cut whatever costs more time than it earns.

## 6. Sources

- Anthropic skills: https://github.com/anthropics/skills
- Impeccable: https://github.com/pbakaus/impeccable
- Taste Skill: https://github.com/Leonxlnx/taste-skill
- Hallmark: https://github.com/nutlope/hallmark
- avoid-ai-design: https://github.com/funboy322/avoid-ai-design
- Vercel Web Interface Guidelines: https://github.com/vercel-labs/web-interface-guidelines
- Artificial Hivemind: https://arxiv.org/abs/2510.22954 ; NeurIPS awards: https://blog.neurips.cc/2025/11/26/announcing-the-neurips-2025-best-paper-awards/
- Verbalized Sampling: https://arxiv.org/abs/2510.01171
- Exploration vs. Fixation: https://arxiv.org/abs/2512.18388
- Homogenisation meta-analysis: https://research.tilburguniversity.edu/en/publications/generative-ai-makes-creative-output-more-homogeneous/ and https://www.tandfonline.com/doi/full/10.1080/0144929X.2026.2726451
- Doshi and Hauser: https://news.exeter.ac.uk/?p=13749
- Human Creativity in the Age of LLMs: https://arxiv.org/abs/2410.03703
- Prompting Diverse Ideas: https://papers.ssrn.com/abstract=4708466
- Effects of GenAI on design fixation (CHI 2024): https://dl.acm.org/doi/full/10.1145/3613904.3642919
- GenAI and critical thinking (CHI 2025): https://www.microsoft.com/en-us/research/?p=1135061
- PromptCraft rules (example contest): https://rvrjcce.ac.in/xcsm/aikshetra2K25/promptcraft.php
