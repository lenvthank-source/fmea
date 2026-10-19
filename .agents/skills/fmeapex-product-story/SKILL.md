---
name: fmeapex-product-story
description: Design or refine FMEApex public marketing pages and interactive product demonstrations around connected DFMEA, PFMEA, control plans, and verified mitigation. Use for the public product story, not authenticated engineering workflows.
---

# FMEApex product story

Explain what a quality engineer can follow through the product: structure and function, failure relationships, process controls, then verified action. Ground claims in the current graph and implementation rather than treating architecture aspirations as shipped functionality.

## Project context

Follow the repository AGENTS.md graph-first navigation rule. The homepage entry is `frontend/src/features/landing/LandingPage.tsx`; its local interactive model is `ConnectedProduct.tsx`, and scoped styles live in `landing-story.css`. All public pages, including the homepage, share `components/site/SiteHeader.tsx` and `SiteFooter.tsx`. `PublicLayout.tsx` owns inner-page semantics, warmup, and metadata. `public-content.ts` is the typed catalog for all 17 resource/article destinations; `public-site.css` extends the homepage identity without altering application tokens. Check callers before changing shared components.

The homepage tells this sequence:
- Disconnected files create handoff and version problems.
- DFMEA organizes systems, components, functions, and failures.
- PFD and PFMEA connect process steps and failure coverage.
- PFMEA and the control plan share linked controls and tolerances.
- Actions connect priorities to owners, evidence, and verification.

Distinguish design-to-process characteristic flow-down from the bidirectional PFD/PFMEA/control-plan relationship. Do not imply every DFMEA field automatically synchronizes with every document.

## Design decisions

Use the public palette in `.agents/rules/ui-theme.md`: ivory, graphite, orange, and restrained contextual green for connected engineering data. Keep marketing styles scoped under `.fmea-story` and inside a CSS layer. Leave workspace tokens and dense engineering screens alone unless requested.

Use the engineering relationship itself as the memorable visual. Prefer interactive components and semantic SVG/CSS diagrams over generic dashboard screenshots, stock manufacturing images, floating badges, or endless decorative motion. The current scroll story uses one sticky relationship diagram and four readable chapters. Smaller screens keep all chapter content in normal flow.

Motion should make a change understandable: selecting a component, switching a document, moving through a chapter. Respect reduced motion, retain content without entrance animations, and provide keyboard-operable alternatives to scrolling or pointer gestures. Avoid autoplay loops unless the user can pause them.

## Demonstration integrity

Label local illustrative data as a preview. Keep preview interactions local; never write analysis rows or create live projects to make a marketing animation work. Show the actual changed control in both preview views when demonstrating linked updates. Reuse the production AP calculator for interactive risk examples; do not invent AP mappings or imply that marking a task complete automatically reduces risk.

Use `TrialButton` for public trial actions: anonymous visitors go through `/app/initializing`; signed-in visitors open `/app/projects`. Use Try it out or Try FMEApex, never sandbox copy. Preserve authenticated workspace routing, backend warmup states, contact payload compatibility, and existing incoming section links. Quote links use `/?offer=<label>#contact` and prefill the existing message field. Contact forms need associated labels, native validation, pending/error/success feedback, and no fabricated response-time promise.

Avoid unsupported customer counts, ROI percentages, guaranteed zero defects, certification badges, or unverified regulatory compliance claims. Describe the implemented review, evidence, signature, and revision features precisely.

## Verify

Build the frontend, check lint findings in changed files, and inspect desktop and narrow mobile layouts. Exercise document and component switching, linked preview updates, seven-step controls, calculator disclosure, mobile navigation, and anchor navigation. Check for horizontal overflow and visible keyboard focus. Do not submit a real contact inquiry during UI checks without authorization.

Run the repository README sync and graph update after changes. Record touched files, validation results, and deployment status in ACTIVE_STATE. Follow the repository version confirmation rule before any commit or publication.

## Public resource and metadata contract

- Preserve the 23 English public URLs in `docs/specs/connected-quality-delivery.md`. Invalid slugs render `PublicNotFound` with noindex, never another article.
- Legacy en/de/ja/zh detail aliases redirect to English, preserving query/hash. Do not advertise untranslated hreflang URLs.
- Journal articles live in the typed catalog. Do not call nonexistent CMS endpoints or publish fabricated bylines/dates.
- Paid offers request a quote. Trial copy describes one custom project for 24 hours separately from session lifetime.
- SEO alone controls route metadata. Keep index.html free from duplicate canonicals, stale offers, or site-wide FAQ claims. Synchronize sitemap, pricing.md, llms files and okf bundle.
- Do not display invented AP categories without ratings in illustrative previews. Use the production calculator for numerical examples.
- Source handbook-dependent details explicitly. Review/revision features do not establish blanket Part 11 compliance.
