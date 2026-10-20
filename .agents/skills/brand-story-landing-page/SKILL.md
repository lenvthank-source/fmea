---
name: brand-story-landing-page
description: Interviews the user, then builds a storytelling-first landing page / home page for a brand, using the "reveal an idea" principles from TED-Ed's Public Speaking 101 lesson "How to present your ideas effectively" (journey, demonstration, vision). Use this whenever the user wants a brand's first landing page, homepage, hero, or "story" website, even if they only say "build me a site for my startup / product / brand", "make a landing page that tells our story", or describe a brand idea and ask for a page. It collects brand facts plus images, videos, animations, diagrams and anything else the user can supply BEFORE building, then explains why every section exists. When the page needs images or videos the user doesn't have, it also writes ready-to-paste image and video generation prompts into a Brand_content folder in the project directory. Not for multi-page sites, dashboards, or copywriting-only tasks.
---

# Brand Story Landing Page

A landing page is a talk the visitor takes alone, at their own pace, with their thumb ready to leave. The TED-Ed lesson this skill is built on says a good talk reveals an idea so the audience feels wonder and curiosity, rather than just being informed. The same holds on a page: visitors stay when something is being *revealed* to them, and leave when they are being *described at*.

So this skill does two jobs in order: (1) find out what the brand really has to reveal and what real material exists to show it, and (2) build a page whose structure follows the lesson's three ways of revealing an idea, with a reason for every section.

Read `references/story-framework.md` before planning. It holds the lesson's ideas and how each maps to page sections.

## Workflow

Do not skip to building. A page made from guesses reads as a template, and invented proof (quotes, numbers, logos) damages the brand's credibility on day one.

### 1. Intake: ask before you build

Gather what you need using `references/intake.md` (question bank, rounds, minimum brief). Key rules:

- First use what the user already said, uploaded or linked. Ask only for what is missing.
- Ask in short rounds (about 3 questions each). If `ask_user_input_v0` is available, use it for choices; use plain questions for open answers like the brand's one-sentence idea.
- Always ask what **material** they can supply: photos, product shots, videos, screen recordings, logos, existing diagrams, animations, press, testimonials, numbers. Also ask what they would like you to create for them (animated SVG, diagrams, illustrations) when they have nothing. Real material beats generated material wherever it exists.
- If any media will need to be generated, ask which image and video generation tools they use (for example Veo/Flow, Gemini Omni Flash, Nano Banana, Imagen, Midjourney, Sora, or "not sure"), so the prompts match the tool's style and length limits.
- Ask the **output format** every time: a single self-contained HTML page, or React project files (and anything else relevant, like language or tech limits). Do not assume.
- Do not start building until the minimum brief in `intake.md` is met. If the user says "just build it", state your assumptions in a few lines, get a quick yes, then proceed.

### 2. Choose the story shape

From the intake, pick which of the lesson's three reveal types the page needs: **journey**, **demonstration**, **vision**. Most brands need a combination led by one type, and the lesson itself says to select, combine and adjust. Use the decision hints in `story-framework.md`. Say which you chose and why in one or two sentences.

### 3. Story map, confirmed before code

Present a short story map: each section in order, what the visitor should feel or understand there, which asset or animation carries it, and which principle from the lesson justifies it. Keep it to a compact list. Ask the user to confirm or adjust. This is the cheapest moment to change direction, and it is also where the "justification" the user wants gets shown.

Include a **media plan** with the map: for every image or video the page wants, say whether it is (a) supplied by the user, (b) built in code (animated SVG, diagram, CSS), or (c) needs a generated or shot asset, in which case you will write a prompt for it (step 4). Flag any slot where real material is missing and what you'll do about it.

### 4. Media prompts (only for slots that need generated or shot media)

For each slot in group (c) of the media plan, write a prompt file in a `Brand_content/` folder placed in the project directory: next to the page for a single HTML file, at the project root for React. Naming: `Brand_content/video_prompt1.md`, `video_prompt2.md`, ... and `Brand_content/image_prompt1.md`, `image_prompt2.md`, ... (one file per asset), plus a short `Brand_content/README.md` index that maps each file to the page section it fills. Read `references/media-prompts.md` for the file template, continuity rules and the guidance on real versus generated media. If a matching prompt-writing skill is installed for the user's tool (for example `/mnt/skills/plugins/google-flow-prompts/SKILL.md` for Veo, Flow, Nano Banana and Imagen, or `/mnt/skills/plugins/gemini-omni-flash-prompts/SKILL.md` for Gemini Omni Flash), read it and follow its prompt format.

Skip this step when the user supplied everything the page needs, or when every moving or visual element is built in code. Don't write prompts nobody needs.

### 5. Build

Before writing code, read `/mnt/skills/public/frontend-design/SKILL.md` for visual direction and typography, and follow its plan-then-build process. Then use `references/visual-storytelling.md` for how to treat each asset type, how to build animation and diagram moments, and format-specific notes for HTML vs React.

Hold to these, each for a reason:

- **The hero is the tease.** It should create curiosity about the reveal, not explain the company. A visitor who cannot say what feels intriguing after one screen has no reason to scroll.
- **One orchestrated moment.** Spend your motion budget on the demonstration or reveal, where movement shows how something works or what changed. Scattered fade-ins on every section add noise and read as generic.
- **Proof is real or absent.** Never fabricate testimonials, statistics, customer logos, press mentions or awards. If the user has none, leave the proof out or mark a clearly visible placeholder and tell them.
- **Placeholders are honest and traceable.** A missing photo or video gets a labeled slot with the intended content, dimensions, and the prompt file that produces it (for example "video_prompt1"), not a stock-looking substitute. Design the slot at the same aspect ratio as the prompt so the real asset drops in without layout changes.
- **Quality floor.** Responsive down to phone width, visible focus states, `prefers-reduced-motion` respected (the story must still read with motion off), good contrast, and meaningful alt text.
- **Copy is part of the story.** Write from the visitor's perspective in plain language; specific beats clever.

### 6. Review and deliver

Check the page against the story map: does each section do the job you named? Fix what doesn't. Then deliver in the format the user chose, and finish with a **story rationale**: one short line per section in the form "Section → what it reveals → which lesson principle it applies." List the prompt files created and which slot each fills, and anything else still needed from the user (missing assets, claims to verify, placeholders to replace).

## Limits to be upfront about

- The page's structure comes from a public-speaking lesson adapted to the web. That is a framework for storytelling, not proof that a page will convert. Don't promise results.
- Don't present generated illustrations or diagrams as photographs of the real product or team.
