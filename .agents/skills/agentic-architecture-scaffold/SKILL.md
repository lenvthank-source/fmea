---
name: agentic-architecture-scaffold
description: Design, bootstrap, and maintain a document-driven AI agent architecture (.agents/ + AGENTS.md) for any codebase, in any language or framework. Use when users want to establish or refactor an agentic memory system that eliminates repeated whole-codebase scanning, enforces living documentation, locks domain boundaries, and enables autonomous agents to operate without context starvation or model drift.
---

# Agentic Architecture Scaffold (`agentic-architecture-scaffold`)

A comprehensive, language-agnostic skill and automated bootstrapping toolkit for building **Document-Driven AI Agent Architectures** (`.agents/` + `AGENTS.md`).

---

## 1. 🧠 The Document-Driven Paradigm vs. Blind Code Scanning

### The Core Problem in Agentic Development
As repositories grow past 20–30 files or 10,000+ lines of code, AI coding assistants (Gemini, Claude, GPT, DeepSeek) suffer from **Context Degradation & Token Starvation**:
1. **Excessive Token Burn**: Agents waste 80%–90% of their context window repeatedly grepping, listing directories, and viewing 100KB+ source files just to understand basic routing, schemas, or dependencies.
2. **Context Saturation & Hallucination**: Overloading the prompt with thousands of lines of raw AST code dilutes attention, leading the model to hallucinate variable names, forget system rules, or introduce regressions.
3. **Implicit Knowledge Loss**: Important architectural constraints (e.g. "always pass X-Session-Id", "timeout is 30s", "gemstones cannot be hardcoded in prompts") are buried in code comments and easily overlooked.
4. **Drift Across Turns**: On every conversational turn or rotation, the agent restarts with zero persistent memory of prior architectural decisions.

### The Solution: The Document-Driven Architecture
Instead of having the AI re-read raw source code on every rotation, the system establishes a **curated, modular knowledge and memory hierarchy** within `.agents/`:
- **Fast Lookup ($10\times$ cheaper and faster)**: The agent navigates directly to modular, domain-specific markdown documents (e.g. `memory/timing_engines.md` or `agents/database_lifecycle_agent.md`).
- **Living Truth**: Documentation is NOT an afterthought written at the end of a project. It is actively updated in the **exact same turn as code modifications**.
- **Surgical Code Inspection**: With crystal-clear domain specifications, the agent only reads targeted 30–50 line code slices using line-bounded slice tools.

```
┌─────────────────────────────────────────────────────────────┐
│                    AI AGENT REQUEST                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
               1. Consult AGENTS.md Navigation Index
                               │
       ┌───────────────────────┼────────────────────────┐
       ▼                       ▼                        ▼
┌──────────────┐       ┌──────────────┐         ┌──────────────┐
│ rules/*.md   │       │ agents/*.md  │         │ memory/*.md  │
│ Hard System  │       │ Persona Role │         │ Deep Domain  │
│ Constraints  │       │ & Ownership  │         │ Specs & Math │
└──────┬───────┘       └───────┬──────┘         └──────┬───────┘
       └───────────────────────┼────────────────────────┘
                               │
               2. Surgical Code Reading (Line-Bounded)
                               │
               3. Code Implementation & Unit Testing
                               │
               4. MANDATORY SAME-TURN SYNC:
                  Update affected README.md, memory/*.md,
                  rules/*.md, and AST Knowledge Graph
```

---

## 2. 📂 The 7-Subsystem Directory Architecture

The `.agents/` structure decomposes codebase intelligence into 7 dedicated subsystems:

```
.agents/
├── AGENTS.md                                # Executive entry point & navigation index
├── agents/                                  # Specialized AI Agent personas & domain boundaries
│   ├── README.md                            # Agent roster & delegation matrix
│   ├── api_gateway_agent.md                 # Routing, middleware, rate-limiting & auth
│   ├── database_lifecycle_agent.md          # Schema migrations, ORM, connections & caching
│   └── domain_specialist_agent.md           # Core business domain logic & algorithms
├── skills/                                  # Task-specific agent skills & diagnostic scripts
│   ├── README.md                            # Skills catalog & CLI invocation syntax
│   └── <skill-name>/                        # SKILL.md + isolated diagnostic scripts
├── rules/                                   # Live system rules (Auto-loaded into agent runtime)
│   ├── architecture.md                      # Layering, protocols, connection lifecycles
│   ├── coding-style.md                      # Language standards, timeouts, completion mandates
│   ├── testing.md                           # Automated test suites, zero residue policies
│   ├── git.md                               # Commit approvals, branch conventions, PR checks
│   ├── security.md                          # Secret hygiene, API keys, quota accounting
│   └── no_drift_clarification.md            # Halt-on-uncertainty & anti-drift protocols
├── context/                                 # Static project & domain background
│   ├── project.md                           # Technology stack, repositories, infrastructure
│   ├── domain.md                            # Industry-specific principles & domain ontology
│   └── glossary.md                          # Technical and business terminology
├── memory/                                  # Deep subsystem domain specifications
│   ├── domain_algorithms.md                 # Core mathematical formulas & business rules
│   ├── external_providers.md                # Third-party APIs, vendor quirks, rate limits
│   └── data_schemas.md                      # Core entity relations & serialization rules
├── checklists/                              # Operational checklists
│   └── pre-commit.md                        # Mandatory pre-commit verification steps
└── workflows/                               # Actionable step-by-step developer guides
    ├── development_workflow.md              # Feature implementation & testing lifecycle
    └── deployment_workflow.md               # Staging & production deployment guide
```

---

## 3. 🎯 The 4-Tier Memory Hierarchy

| Tier | Subsystem | Purpose & Scope | When the Agent Reads It |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **`rules/*.md`** | **Hard System Constraints**: Inviolable operational rules auto-loaded into the system prompt. Covers security, git policies, anti-drift, and formatting rules. | At the start of every session (auto-loaded). |
| **Tier 2** | **`agents/*.md`** | **Persona Boundaries & File Ownership**: Defines which agent persona owns which directories, files, and unit tests. Prevents cross-domain pollution. | When planning features or assigning tasks to subagents. |
| **Tier 3** | **`memory/*.md`** | **Deep Domain Specifications**: Exhaustive algorithmic formulas, data schemas, vendor quirks, and historical edge cases. Replaces raw code reading. | Before reading or writing code in that specific subsystem. |
| **Tier 4** | **`workflows/*.md`** | **Actionable Standard Operating Procedures**: Step-by-step developer guides for deployment, migration, testing, and documentation synchronization. | When executing complex, multi-step operations. |

---

## 4. 🔄 The Mandatory Same-Turn Synchronization Law

> [!IMPORTANT]
> **The Living Documentation Mandate**:
> Whenever an agent modifies application code, schemas, or endpoints, it **MUST** update the corresponding documentation files in the **exact same turn**. Documentation is never updated "later".

### Synchronization Matrix:
Whenever you change code in a subsystem, update all 4 linked artifacts:
1. **Module `README.md`**: Update feature lists, configuration tables, and endpoint catalogs in the modified module's directory (e.g. `src/auth/README.md`).
2. **Subsystem Memory (`.agents/memory/`)**: Update algorithmic formulas, entity definitions, and provider behaviors in the corresponding memory spec.
3. **Agent Persona (`.agents/agents/`)**: Update file ownership, directives, and checklist items for the responsible agent persona.
4. **Codebase Knowledge Graph**: Re-index the AST graph (e.g. via `graphify update .` or language-specific ctags/LSP).

---

## 5. 🛡️ Anti-Hallucination & Anti-Drift Protocols

### 5.1 Zero Concrete Entity Examples Rule (Strict Abstract Schema Mandate)
- **Problem**: LLMs (especially fast/flash models) latch onto concrete examples in prompt instructions (e.g. `(e.g. 'Ruby gemstone')` or `(e.g. 2026)`) and hallucinate them into user responses regardless of actual data.
- **Rule**: All prompt instructions and skill templates **MUST NEVER** contain concrete entities in examples.
- **Enforcement**: Always use abstract schema placeholders (e.g. `[Primary Item]`, `[Key Milestone Year]`, `[Calculated Attribute]`).

### 5.2 Zero Drift & Immediate Clarification Protocol
- **Problem**: When an agent encounters ambiguity or cannot find expected files, it often enters a search loop, scanning random directories and burning tokens.
- **Rule**: If the agent loses track of the task, cannot locate information, or encounters conflicting requirements, **it must halt exploratory tool loops immediately and ask the user directly for clarification**.

### 5.3 Zero Test Session Residue Mandate
- **Problem**: Automated tests creating rows in live/dev databases pollute user analytics and trigger false quota deductions.
- **Rule**: All tests must run in isolated in-memory databases, mock clients, or execute deterministic cleanup routines (`tearDown()`, `afterEach()`) guaranteeing zero residue.

---

## 6. 🚀 Universal Turnkey Scaffolding Script

To bootstrap this complete architecture on any repository in seconds, use the self-contained script located at:
`scripts/scaffold_architecture.py`

### Quick CLI Usage:

```bash
# Basic Python / FastAPI project
python .agents/skills/agentic-architecture-scaffold/scripts/scaffold_architecture.py \
  --project "MyProject" \
  --language "python" \
  --framework "fastapi"

# TypeScript / Next.js Fullstack project
python .agents/skills/agentic-architecture-scaffold/scripts/scaffold_architecture.py \
  --project "ShopApp" \
  --language "typescript" \
  --framework "nextjs" \
  --type "fullstack"

# Go Microservices project
python .agents/skills/agentic-architecture-scaffold/scripts/scaffold_architecture.py \
  --project "PaymentService" \
  --language "go" \
  --framework "standard" \
  --type "microservice"

# Rust High-Performance Engine
python .agents/skills/agentic-architecture-scaffold/scripts/scaffold_architecture.py \
  --project "AnalyticsEngine" \
  --language "rust" \
  --framework "actix"
```

### Supported Languages & Built-in Toolchains:
- **Python**: `pytest`, `py_compile`, `ruff`/`flake8`, `mypy`
- **TypeScript / JavaScript**: `npm test` / `vitest` / `jest`, `tsc`, `eslint`
- **Go**: `go test ./...`, `go vet`, `staticcheck`
- **Rust**: `cargo test`, `cargo clippy`, `cargo check`
- **Java / Kotlin**: `mvn test` / `gradle test`, `checkstyle`
- **C# / .NET**: `dotnet test`, `roslyn analyzers`

---

## 7. 📋 Step-by-Step Migration Guide for Existing Codebases

If you are retrofitting an existing codebase that currently suffers from token bloat:

### Phase 1: Subsystem Discovery & Boundary Mapping
1. Identify 3 to 6 major functional subsystems (e.g. Auth, Billing, Data Ingestion, Search, Frontend UI).
2. For each subsystem, designate a **Specialist Agent Persona** in `.agents/agents/<name>_agent.md`.
3. List the exact file and directory paths owned by that persona.

### Phase 2: Knowledge Extraction (Memory vs. Code)
1. Identify complex algorithms, pricing calculators, state machines, or third-party API quirks.
2. Document them explicitly in `.agents/memory/<subsystem>.md`.
3. Ensure all formulas, JSON schemas, and error codes are detailed so future agents can read this file instead of analyzing 500 lines of complex code.

### Phase 3: System Rules Hardening
1. Copy standard rules into `.agents/rules/`:
   - `architecture.md` (caching rules, connection pools, API layer boundaries)
   - `coding-style.md` (language-specific style, timeouts, zero stub mandate)
   - `testing.md` (test command, coverage requirements, zero residue)
   - `git.md` (branch conventions, pre-commit checks, versioning)
   - `no_drift_clarification.md` (halt on uncertainty)

### Phase 4: Executive Navigation Assembly
1. Fill in `.agents/AGENTS.md` with:
   - Directory architecture tree.
   - Navigation & Subsystem Index routing table.
   - Mandatory synchronization rules.
   - Implementation plan standard.

### Phase 5: Verification
1. Test with a mock feature request.
2. Confirm the agent checks `AGENTS.md` and `memory/` first.
3. Confirm the agent performs surgical line-bounded reads instead of whole-file scanning.
4. Confirm documentation is updated in the same turn as code changes.
