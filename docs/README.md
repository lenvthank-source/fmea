# Project Documentation Directory (`docs/`)

This directory contains architectural blueprints, technical design documents, deployment procedures, user guides, functional specifications, and design assets for the FMEA Quality Platform.

## Directory Structure

```
docs/
├── README.md                      # Documentation catalog (this file)
├── SAD-TDD-FMEA-Platform.md       # Full Software Architecture & Technical Design Document
├── ERGONOMICS.md                  # Ergonomics and UX interaction guidelines
├── deployment/                    # Production and staging deployment guides
│   └── cloudflare-render-neon.md  # Cloudflare Pages, Render Web Service, and Neon DB setup
├── guides/                        # User and developer onboarding guides
│   └── first-time-user-guide.md   # Step-by-step first time user walkthrough
├── specs/                         # Feature specifications & implementation reports
│   ├── fmea-tree-ui-redesign-spec.md  # FMEA structural tree visual redesign spec
│   └── pfd-excel-export.md        # PFD Excel export functional report
├── prompts/                       # Design prompts and generation instructions
│   └── design-prompt.txt          # UI theme design and visual styling prompts
├── assets/                        # Design mocks, visual references, and archived icons
│   ├── Picture1.svg               # Architectural vector mock
│   ├── example.png                # Reference screenshot
│   └── legacy_icons/              # Archived design icon sets
└── workflows/                     # Standard domain operating procedures
    ├── ai-suggestion-review.md    # Human-in-the-loop suggestion review SOP
    ├── control-plan-sync.md       # Control plan bidirectional sync SOP
    ├── corrective-actions.md      # Action tracking & R2 evidence SOP
    ├── enterprise-integrations.md # PLM/ERP/MES sync SOP
    ├── fmea-authoring.md          # 7-step FMEA authoring SOP
    ├── pfd-pfmea-linking.md       # Process flow to PFMEA linking SOP
    ├── revision-approval.md       # 21 CFR Part 11 revision lifecycle SOP
    ├── sso-tenant-context.md      # Auth and RLS tenant verification SOP
    └── vector-indexing.md         # Neon pgvector HNSW indexing SOP
```
