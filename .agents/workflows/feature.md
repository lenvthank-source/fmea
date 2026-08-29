# Feature Workflow — Portable Mesh (Orchestrator + Specialists)

0. **Orchestrator gate (mandatory)**: Load `.agents/agents/orchestrator/AGENT.md:1` + `.agents/context/routing.md:1`. Classify intent via keyword→agent table. Fan out to 2–4 matched specialists (`AGENT.md`) with `memory/blackboard.md:1` entries (`pending` + `priority`). Max 4 parallel (queue rest). This step is **model/IDE-agnostic** — works by pasting `AGENT.md` into VS Code/Cursor/Opencode/Gemini/Antigravity or via `python .agents/scripts/dispatch.py --intent "..." --mode plan`.

1. **Understand requirement**: Clarify scope, affected modules, and expected behavior (orchestrator slices intent per agent).
2. **Inspect relevant files**: Read source files in the target module(s) — specialists only inside their `allow` fencing (`AGENT.md:allow`). Cross-module need → `> agent → orchestrator: need X` via blackboard.
3. **Load context**: Load `rules/architecture.md:1` and relevant `skill/SKILL.md` per `context/routing.md:1` + specialist `AGENT.md:loads` (e.g., PFD → `skills/pfd-pfmea-linking/SKILL.md`, PFMEA → `skills/fmea-authoring/SKILL.md`).
4. **Identify existing patterns**: Follow the module's current controller/service/DTO structure (`context/architecture.md:Module Boundary Map`).
5. **Create implementation plan**: Each specialist emits slice with `Files Touched path:line — reason` + `Schema/Migrations`. Orchestrator merges into unified plan and **blocks on human APPROVED** in `blackboard.md` (never auto-proceed, `AGENTS.md:6.5`).
6. **Implement backend first**: Controller route → Service method → DTO validation — specialists write only inside `allow`; orchestrator grants `allow_shared` for `prisma/schema.prisma` explicitly via blackboard.
7. **Implement frontend**: Feature component → API integration → UI state — same fencing.
8. **Add/update tests**: Follow existing Jest patterns when applicable.
9. **Build verification**:
    ```bash
    cd backend && npm run build
    cd frontend && npm run build
    python .agents/skills/readme_sync/scripts/sync_readmes.py
    ```
    Orchestrator runs this after specialists report `completed` in blackboard.
10. **Review diff**: Check for unused imports, tenant isolation, RBAC decorators, fencing violations (`checklists/pre-commit.md` + `allow`).
11. **Commit & push**: Orchestrator creates `versions/vX.Y.Z.md` ledger (`AGENTS.md:5`), asks human to confirm version bump, then `git add -f` (respects `/.agents/` gitignore) and push `main` (Render/Cloudflare auto-deploy).
