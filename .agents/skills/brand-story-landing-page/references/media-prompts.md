# Media prompts: the Brand_content folder

## Contents
- When to write a prompt
- Folder and file naming
- Prompt file template
- Continuity across assets
- Real versus generated media
- README index template

## When to write a prompt

Write a prompt only for a slot in the media plan that needs a generated or newly shot asset and that the user doesn't already have. Typical cases: a hero atmosphere loop, a vision scene, a process or mood image, a short clip that supports the demonstration. Don't write prompts for things you build in code (SVG diagrams, CSS animation) or for assets the user supplied.

## Folder and file naming

Create the folder in the project directory (beside the page for a single HTML file; the project root for React):

```
Brand_content/
  README.md
  video_prompt1.md
  video_prompt2.md
  image_prompt1.md
  image_prompt2.md
```

One file per asset, numbered in the order the assets appear on the page. Use only as many files as the page needs. If the user asked for different folder or file names, follow theirs.

## Prompt file template

Each file is self-contained, so the user can open it, copy the prompt into their tool, and know exactly where the result goes.

```markdown
# video_prompt1: <short name of the asset>

**Fills:** <page section> (<slot label on the page>)
**Story job:** <what this asset reveals or makes the visitor feel, and the principle it applies: tease / demonstration / journey / vision>
**Tool:** <the user's tool, or "tool-agnostic">
**Format:** <video: duration, aspect ratio, loop yes/no, audio none/ambient; image: aspect ratio, minimum width>
**Save as:** <filename the page expects, e.g. assets/hero-loop.mp4> 

## Prompt
```text
<the ready-to-paste prompt, concrete and compact: subject, action or state, setting,
camera and composition (and movement for video), lighting, style>
```

## Avoid
<short negative list: text or logos in frame, distorted hands, morphing, extra limbs, anything off-brand>

## Variations to try
<two or three single-line swaps, such as time of day, camera distance, or palette>

## After generating
<checks and handoff: trim or loop point, crop to the slot's ratio, compress for the web, replace the placeholder labeled "<slot label>">
```

Keep prompts tight; long over-stuffed prompts get partly ignored. Be concrete rather than evocative, always give a camera instruction and a lighting note, and match the tool's own prompt style when a prompt-writing skill for that tool is available.

## Continuity across assets

Assets on one page should feel like one world. Before writing the first prompt, fix a short **style block** from the brand's palette, tone and design plan: look (photographic or illustrated), color palette, lighting character, lens or framing habits, and any recurring subject description. Repeat that block verbatim in every prompt, and say so in the README. For video clips meant to follow one another, repeat character, wardrobe and location details identically in each.

## Real versus generated media

Generated media is good for atmosphere, illustration and imagined scenes (a vision of the future, texture, mood). It is the wrong tool for evidence:

- Don't write prompts that produce photos of the real product, real team members, real customers or real premises and present them as authentic. For those, write a **shoot brief** instead (shot list, framing, light, what to capture) in the same file format, and mark it `shoot brief` in the header so the user knows to film or photograph it.
- Don't generate testimonials, logos of real companies, or anything that implies endorsement.
- If a generated asset stands in for something real, say so in the file, and recommend replacing it with the real thing when available.
- Respect the person's rights: don't prompt for likenesses of real, named people.

## README index template

```markdown
# Brand_content

Prompts for the media this page needs. Style block used in every prompt: <the shared style block>.

| File | Fills (page section) | Type | Save as |
|---|---|---|---|
| video_prompt1.md | Hero | video, 8s loop | assets/hero-loop.mp4 |
| image_prompt1.md | Vision | image, 16:9 | assets/vision.jpg |

Order of use: <one line, if there is a sensible order to generate them in>.
```
