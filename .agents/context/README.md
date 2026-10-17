# Project Context Catalog (`.agents/context/`)

This directory contains static architectural background, domain ontology, API contracts, deployment specifications, and multi-agent routing tables.

## Context Documents

| Document | Scope & Contents |
| :--- | :--- |
| [`project.md`](./project.md) | High-level project summary, technology stack (NestJS, React, Prisma, PostgreSQL, Neon, Render), repository layout. |
| [`architecture.md`](./architecture.md) | Fullstack architecture overview, layering, data flows, and state management. |
| [`domain.md`](./domain.md) | FMEA quality principles, AIAG-VDA 2019 standards, 7-step analysis phases. |
| [`glossary.md`](./glossary.md) | Technical and domain vocabulary (DFMEA, PFMEA, PFD, CP, AP, RPN, S/O/D, 5Ts). |
| [`data-model.md`](./data-model.md) | Overview of the 41 Prisma schema models, indexes, relations, and cascade behaviors. |
| [`api-contracts.md`](./api-contracts.md) | REST API endpoints, DTO payloads, pagination standards, and error schemas (`/api/v1`). |
| [`permissions.md`](./permissions.md) | RBAC permission matrix (5 roles), endpoint guards, and Row-Level Security parameters. |
| [`deployment.md`](./deployment.md) | Cloudflare Pages, Render Web Service, Neon DB, and Cloudflare R2 configurations. |
| [`versioning.md`](./versioning.md) | Semver rules, package.json synchronizations, and `versions/` ledger format. |
| [`routing.md`](./routing.md) | Head orchestrator intent-to-agent dispatch table, priority weighting, and allow globs. |
