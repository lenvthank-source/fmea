# Visual storytelling: assets, animation, diagrams

## Contents
- Using the user's real material
- Building moments when material is missing
- Animation and diagram techniques
- Restraint and accessibility
- Format notes: HTML vs React

## Using the user's real material

Real photos and footage carry trust that generated imagery can't, so use what the user gives you and give it the best role:

- **Hero candidates:** the most striking, least explained image or clip. Pair with a headline that raises a question.
- **Product screenshots / screen recordings:** the demonstration. Show a real input becoming a real output. Crop to the interesting part; trim dead time.
- **Process photos and clips:** the journey. Sequence them as stops on a walk, with a short caption each. Include unfinished or imperfect stages when available; they signal honesty.
- **Logos, press, testimonials:** proof, only as provided and only as real.
- **Video:** muted, looping, short clips with a poster image work well as atmosphere; longer videos belong behind a play control. Check file size and duration; large files may need to be shortened or compressed, so tell the user rather than silently dropping them.
- **Existing diagrams or animations:** reuse and restyle them to the page's system when permitted, rather than redrawing from scratch.

Always write meaningful alt text, and keep captions short and specific.

## Building moments when material is missing

Don't fill gaps with stock-looking filler. Choose by what the moment needs:

- **A mechanism the visitor should understand** → an animated or step-through SVG diagram: inputs, what the product does, outputs. Cause and effect on screen.
- **A before/after** → a draggable or auto-playing comparison built from simple shapes or UI mockups.
- **A future scene (vision)** → one well-composed SVG illustration or typographic scene. One strong image beats a gallery.
- **A process (journey)** → a drawn path or timeline that reveals stops as the visitor scrolls, with a labeled slot for a real photo at each stop.
- **Atmosphere, mood or an imagined scene that needs a photo-like image or a video clip** → a labeled slot at a fixed aspect ratio plus a prompt file in `Brand_content/` (see `media-prompts.md`), so the user can generate the asset and drop it in.
- **Real photos of people, places or the actual product** → a clearly marked placeholder with: what should be shown, the suggested aspect ratio, and a note it needs replacing; if useful, a shoot brief in `Brand_content/`. Never present an illustration or generated image as a photo of the real thing.

## Animation and diagram techniques

Pick the technique that explains, not the one that impresses:

- **Scroll-linked reveal:** a diagram or sequence that advances as the visitor scrolls, so they control the pace of the demo. Good for the demonstration's "show it working" beat.
- **Path drawing:** SVG strokes that draw in to show flow or a journey (`stroke-dasharray` / `stroke-dashoffset`).
- **State change:** the same object shown in two states, toggled by the visitor's click or scroll (before/after, off/on).
- **Hero tease:** a single slow reveal on load: a mask, blur-to-focus, or partially hidden word that resolves. One moment only.
- **Counting and building:** use numbers or bars animating only when the numbers are real and meaningful.

Keep animation in CSS and small amounts of vanilla JS (IntersectionObserver, requestAnimationFrame) unless a library clearly earns its weight.

## Restraint and accessibility

- Spend motion on the reveal; leave other sections still. Staggered fade-ins on every block are a generic default.
- Respect `prefers-reduced-motion`: show the final state and make the story readable without movement.
- Don't hide essential content behind hover or scroll hijacking. Let the page scroll normally.
- Keep text over imagery legible (contrast, overlays) and tap targets comfortable on phones.
- Autoplaying media must be muted, and anything longer than a few seconds should be pausable.
- Test at phone width: diagrams should reflow or scale, not clip.

## Format notes: HTML vs React

The user chooses the format at intake. Follow the format's environment rules, including any file-delivery and publishing steps your current environment defines.

**Single HTML page**
- One self-contained file: inline CSS and JS, assets embedded or referenced in ways the environment allows. If the page will be hosted, check what external resources are permitted and embed images as data URIs when needed, watching total file size.
- Define colors as CSS variables and support light/dark if appropriate to the brand.
- Best for quick preview and sharing.

**React project files**
- Structure as components that map to the story map, one per section (Hero, Context, Demo, Journey, Vision, Call to action), with a small shared design-tokens file.
- Put copy and asset references in a single data file so the user can edit the story without touching layout code.
- Include a short README: how to run, where to swap placeholders.
