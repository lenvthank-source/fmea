# Ergonomics — Dense, Visible, Low-Friction

Source: `design_prompt.txt:1` single-viewport bento (`720px` nav pill, `100vh/100dvh` video, `BubbledotICG-FinePos`), `frontend/src/theme/theme.ts:19 #F8FAFC`, `frontend/src/components/Layout/AppShell.tsx:209`, `frontend/src/features/pfd/PfdWorkspace.tsx:877`, `frontend/src/features/pfmea/PfmeaWorkspace.tsx:1472`.

## Principles

- **Font integrity preserved**: `TableCell 0.85rem (13.6px)` `theme.ts:152`, `Pfd 14px`, `CTA 13.5-14.5px` **not reduced**. Density via chrome, not type.
- **Bento 48px toolbar**: `AppShell:443 p:3 24px → p:2 16px`, `DocumentHeader:91 mb:3 Card → inline crumb 48px`, one collapse chevron (`AppShell:418` keep, `222` removed), `Drawer 64→48 icon-only`.
- **Unify Fab**: header `Button contained Add Process Step` is truth (`PfdWorkspace:900`), `Fab 1282 variant=extended` removed or kept only when `steps.length>0` but `zIndex 1300` `FeedbackWidget:60` lowered to `36px bottom:12`.
- **Columns**: `PFMEA 25 cols >3500px 1472` default hide `FC/Remarks/revised S/O/D` behind expand, `minWidth 180→120` via abbrev, pin `Structure #45 WE 240 1534`; `PFD 10 cols 1460px 877` same.
- **Affordance**: `PfdCellWrapper:68 500ms → 0ms` `Edit/Copy`, one `Drawer 500px 1695`, all deletes `ConfirmDialog:1` (kill `window.confirm 1067/1251`).

## Verified

- `LandingPage:HeroVideo` 100vh black video `d8j0ntlcm91z4...mp4` only on `/`, rest light `#F8FAFC` `index.css:10`.
- `sitemap.xml:3` 18 URLs, `SEO:52 hreflang`.
