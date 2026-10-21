# Demonstration-led homepage — 2026-10-21

## Authorized brief and story

The user selected an update to the existing React homepage, existing product UI with code-built diagrams and animation, and demonstrable product functionality as the only proof. They approved this story before implementation:

1. Hero: **One engineering decision. Follow it everywhere.** Tease the relationship rather than enumerate features.
2. Disconnected files: establish the version/context problem engineers recognize.
3. Engineering thread: inspect design intent, process flow, process risk, production controls and action evidence around bearing alignment.
4. Reviewed change: propose a detection-control change, compare it, keep the current control or apply it to the local preview.
5. Method and evidence: revisit the seven activities, then explain review, protected history and evidence.
6. Closing vision: explore a reference workspace or use the existing contact form.

This combines demonstration with a brief problem journey and a closing vision, following `.agents/skills/brand-story-landing-page`. There are no fabricated testimonials, customer logos, statistics, generated photographs or unfilled media slots. All new visuals are semantic HTML/SVG/CSS; no `Brand_content` generation prompts are needed.

## Implementation boundaries

- `frontend/src/features/landing/LandingPage.tsx`: homepage orchestration, sections, method control, lazy calculator and contact form.
- `EngineeringStory.tsx`: illustrative hero, five document views and reviewed-change interaction.
- `home-story-content.ts`: typed local narrative and example content.
- `home-story.css`: homepage-only layout under `.story-home`, inside the components layer. Shared public identity/chrome remain in `landing-story.css` and `components/site`.
- `RiskCalculatorWidget.tsx`: retain the existing calculator and configured-profile caveat; replace its separate guest-login/fallback handler with the shared `TrialButton`.

The main demonstration has no backend mutation. A proposal does not change the thread's baseline; applying updates its control-plan view and linked control text, and reset restores the baseline. It does not change ratings or action states. Removed action buttons transfer focus to the next primary action without scrolling. Only explicit user actions trigger the short apply highlight; CSS suppresses motion under reduced-motion preference.

Preserved contracts: shared header/footer, anonymous trial `/app/initializing`, authenticated `/app/projects`, backend readiness, canonical `/`, `#story`, `#sync`, `#workflow`, `#contact`, `#simulator`, `?scroll=<id>` and `?offer=<label>#contact` prefill. Contact payload remains `{name,email,company,type,message}` to `/auth/contact`, with required fields, pending/error/success states and no response-time promise.

## Verification

- Final frontend production build/TypeScript, backend production build and targeted oxlint: passed. Existing MUI barrel and large-chunk warnings remain. No backend/domain source changes or database migrations were introduced.
- Actual browser: all five document views; propose, keep, keyboard apply and reset; linked control-plan text; all seven method selections; lazy calculator disclosure, scenario switch and keyboard rating input; mobile navigation; contact anchor; legacy scroll query; quote prefill; required-field validity; one canonical and no duplicate IDs.
- Responsive browser inspection: desktop content widths 1105/1261px and narrow content width 310px, including the expanded calculator, showed no document overflow or out-of-bounds main content. Three-column desktop and stacked mobile preview inspected visually.
- Final short-desktop pass: primary trial action fully visible (bottom 583px in a 637px viewport). No console errors after a fresh final reload. Reduced-motion behavior reviewed in scoped CSS; browser preference emulation was not performed.
- No real contact inquiry submitted. Trial navigation preserved through the shared implementation; no new trial account was created for QA. No change to engineering data, schema or authentication APIs.
- Screenshot artifacts are outside shipped assets in `C:/Users/Palak/.codex/visualizations/2026/10/18/01a15026-af67-7522-87fc-f43cefdb4e2b/`: `homepage-engineering-thread.png`, `homepage-form-mobile.png` and `homepage-story-desktop.png`.

README sync, final builds and Graphify results are recorded in `.agents/ACTIVE_STATE.md`. The user subsequently requested Git publication and confirmed patch release **0.12.3**. See `versions/v0.12.3.md`. No database migration is required; Git publication and hosted deployment verification remain distinct.
