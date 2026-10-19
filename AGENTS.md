# FMEApex Quality Platform — Agent Rules & Knowledge Graph

> **Universal Context Architecture**:
> - Core Architecture & Invariants: [`.agents/AGENTS.md`](file:///f:/proj-fmea/.agents/AGENTS.md)
> - Active Session State & Handoff: [`.agents/ACTIVE_STATE.md`](file:///f:/proj-fmea/.agents/ACTIVE_STATE.md)
> - OpenAI Codex Guide: [`CODEX.md`](file:///f:/proj-fmea/CODEX.md)

## graphify

This project has a deterministic knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- **Always on after changes**: Run `graphify update .` after each logical code-change batch and again after any later code edits, before completing work or handing off. This AST-only refresh needs no API key. Preserve generated graph changes; fix extraction errors or record an explicit blocker.
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
