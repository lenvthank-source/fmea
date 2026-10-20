# Intake: what to ask before building

## Contents
- How to run the intake
- Minimum brief (do not build without these)
- Round 1: the brand and its one idea
- Round 2: story fit and proof
- Round 3: material (images, videos, animations, diagrams)
- Round 4: output and constraints
- Handling gaps and "I don't know"

## How to run the intake

Questions cost the user effort, so earn each one. Before asking, scan what's already in the conversation, uploads and links, and skip anything answered. Ask in rounds of about three questions, in the order below, and let early answers shape later questions (a brand with no product to show doesn't need demo questions).

Use tappable options (`ask_user_input_v0`) when the answer is a choice among a few things. Use open questions when the answer is the user's own words, like the brand's idea. After each round, briefly reflect back what you understood so errors surface early.

## Minimum brief

Don't start the story map until you have:

1. Brand name and what it is or does, in the user's words
2. Who the page is for (the visitor) and what they should do (primary call to action)
3. The **one idea** the page should reveal: the thing that, once seen, makes the brand click
4. Which real proof exists (numbers, customers, press, testimonials), even if the answer is "none yet"
5. What material the user can supply, and what they want created
6. Output format

## Round 1: the brand and its one idea

- What's the brand called, and what does it do, in a sentence or two?
- Who is the page for, and what should they do after reading it (buy, book, sign up, contact)?
- If a visitor remembered only one thing, what should it be? What's the thing that makes people say "oh, now I get it"?
- Stage: launching, early, or established? (Changes how much proof and history to expect.)

## Round 2: story fit and proof

Aim these at choosing journey, demonstration, vision (see `story-framework.md`):

- Is there something that can be shown working (a product, process, result)?
- Is there a making process, craft or founder story worth walking through?
- Is there a changed future or cause the brand stands for?
- Which real proof exists: customer numbers, results, testimonials, logos, press, awards, certifications? Anything the brand wants to claim but can't back up yet?
- Tone and personality: a few words, or brands/sites they admire, and anything to avoid
- Existing brand identity: logo, colors, fonts, or free to propose?

## Round 3: material

This is the heart of the skill's storytelling. Ask directly and invite uploads:

- What do you have that I can use? Photos (product, team, process, places), product screenshots or screen recordings, videos, logos, existing diagrams or illustrations, animations, packaging, documents
- For anything you don't have, which route do you want? (a) I build it in code: animated diagrams or SVG illustrations; (b) I write prompts you can paste into an image or video generator, saved in a Brand_content folder; (c) a labeled slot you fill later. Different slots can take different routes.
- If prompts: which image and video tools do you use (Veo/Flow, Gemini Omni Flash, Nano Banana, Imagen, Midjourney, Sora, other, not sure)? Any look or style references?
- Is there a moment you picture, like "a video playing behind the headline" or "a diagram showing how it works"? Capture it in their words.
- Any constraints on media: file size, rights or permissions, things that can't be shown?

When files arrive, look at them (view images; check video duration and size) and note what each can do in the story: a hero candidate, a process step, proof, a demo. Tell the user which you plan to use where. Ask about unusable ones only if it matters.

## Round 4: output and constraints

Ask every time, never assume:

- Output: a single self-contained HTML page, or React project files? (If the user isn't sure, one line on the difference: HTML is the fastest to preview and share; React suits a project they'll keep building on.)
- Language(s) and any copy that is already written or approved
- Anything else the page must include: forms, pricing, contact details, links, legal text, analytics hooks
- Deadline or scope limits, if any (a one-screen teaser vs. a full-length story page)

## Handling gaps and "I don't know"

- **No unique idea yet:** offer two or three candidate "reveals" drawn from what they've told you and let them pick or adjust. Don't invent facts to support them.
- **No proof:** build without a proof section and tell them what to add later. Proof the brand can't back up is worse than none.
- **No assets:** plan animated SVG or diagram moments for the demonstration and vision, and labeled placeholders for photos or video of real things (team, product, place).
- **"Just build it":** list your assumptions in a few lines, ask for a quick yes, then proceed. The minimum brief still applies; assume the rest.
