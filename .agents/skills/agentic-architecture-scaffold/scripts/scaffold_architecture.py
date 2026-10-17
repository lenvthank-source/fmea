#!/usr/bin/env python3
"""
scaffold_architecture.py — Universal Turnkey Scaffolding Engine for Document-Driven AI Agent Architectures (.agents/ + AGENTS.md)

Generates a modular, token-efficient, document-first agentic memory subsystem
for ANY project, ANY programming language, and ANY architectural stack.

Zero external dependencies (uses standard Python 3.8+ library).
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Dict, List, Any


# Language-specific tooling and test command profiles
LANGUAGE_PROFILES: Dict[str, Dict[str, str]] = {
    "python": {
        "compile_cmd": "python -m py_compile <files>",
        "test_cmd": "pytest tests/ -v",
        "lint_cmd": "ruff check .",
        "type_cmd": "mypy .",
        "doc_ext": ".py",
        "timeout_rule": "Enforce explicit 30.0s timeouts on all external HTTP/DB calls using httpx or asyncio.wait_for.",
        "anti_stub_rule": "Never leave '# TODO' or pass in production methods. Implement complete defensive routines.",
    },
    "typescript": {
        "compile_cmd": "npm run build || npx tsc --noEmit",
        "test_cmd": "npm test || npx vitest run",
        "lint_cmd": "npm run lint || npx eslint .",
        "type_cmd": "npx tsc --noEmit",
        "doc_ext": ".ts",
        "timeout_rule": "Enforce AbortSignal.timeout(30000) or explicit Promise.race timeouts on fetch/axios calls.",
        "anti_stub_rule": "Never leave 'throw new Error(\"Not implemented\")' or '// TODO'. Implement complete logic with Zod validation.",
    },
    "javascript": {
        "compile_cmd": "node --check <file>",
        "test_cmd": "npm test || npx jest",
        "lint_cmd": "npx eslint .",
        "type_cmd": "npx checkjs",
        "doc_ext": ".js",
        "timeout_rule": "Enforce AbortSignal.timeout(30000) on all network calls.",
        "anti_stub_rule": "Never leave empty stubs or uncaught promise rejections.",
    },
    "go": {
        "compile_cmd": "go build ./...",
        "test_cmd": "go test -race -v ./...",
        "lint_cmd": "golangci-lint run || go vet ./...",
        "type_cmd": "go vet ./...",
        "doc_ext": ".go",
        "timeout_rule": "Enforce context.WithTimeout(ctx, 30*time.Second) on all external network and database calls.",
        "anti_stub_rule": "Never return nil errors with uninitialized structs. Handle all error branches explicitly.",
    },
    "rust": {
        "compile_cmd": "cargo check",
        "test_cmd": "cargo test --all-targets",
        "lint_cmd": "cargo clippy -- -D warnings",
        "type_cmd": "cargo check",
        "doc_ext": ".rs",
        "timeout_rule": "Enforce tokio::time::timeout(Duration::from_secs(30), ...) on all async futures.",
        "anti_stub_rule": "Never leave 'todo!()' or 'unimplemented!()' in production branches. Handle all Results and Options.",
    },
    "java": {
        "compile_cmd": "./mvnw compile || ./gradlew compileJava",
        "test_cmd": "./mvnw test || ./gradlew test",
        "lint_cmd": "./mvnw checkstyle:check || ./gradlew check",
        "type_cmd": "./mvnw compile",
        "doc_ext": ".java",
        "timeout_rule": "Enforce explicit ConnectionTimeout and SocketTimeout (30000ms) on HTTP and JDBC clients.",
        "anti_stub_rule": "Never catch generic Exception and swallow it. Return Optional or throw typed domain exceptions.",
    },
    "csharp": {
        "compile_cmd": "dotnet build",
        "test_cmd": "dotnet test",
        "lint_cmd": "dotnet format --verify-no-changes",
        "type_cmd": "dotnet build",
        "doc_ext": ".cs",
        "timeout_rule": "Pass CancellationToken with 30s timeout to all async Task methods.",
        "anti_stub_rule": "Never throw NotImplementedException in production code. Provide robust defensive implementations.",
    },
}


def build_agents_md(project_name: str, language: str, framework: str, subsystems: List[str]) -> str:
    """Generates the executive AGENTS.md navigation index."""
    profile = LANGUAGE_PROFILES.get(language.lower(), LANGUAGE_PROFILES["python"])

    routing_rows = []
    for sub in subsystems:
        clean = sub.strip().lower().replace(" ", "_")
        title = clean.replace("_", " ").title()
        routing_rows.append(
            f"| **{title}** | [{clean}_agent.md](file:///./.agents/agents/{clean}_agent.md) | [{clean}-specialist](file:///./.agents/skills/{clean}-specialist/SKILL.md) | [architecture.md](file:///./.agents/rules/architecture.md) | [/{clean}_workflow](file:///./.agents/workflows/{clean}_workflow.md) |"
        )

    routing_table = "\n".join(routing_rows)

    return f"""# AI Agent Executive Guidelines (`AGENTS.md`)

Welcome to the `{project_name}` workspace. This document serves as the executive index and architectural guide for AI coding assistants.

Specific operational rules, system constraints, workflows, and domain specifications have been modularized into dedicated directories within `.agents/`.

---

## 1. 📂 `.agents` Directory Architecture

The workspace is organized into 7 modular subsystems:

```
.agents/
├── AGENTS.md                                # Executive entry point & navigation index
├── agents/                                  # Specialized AI Agent personas & domain boundaries
│   ├── README.md                            # Agent roster & delegation matrix
{chr(10).join([f'│   ├── {s.strip().lower()}_agent.md' for s in subsystems])}
│   └── system_architect_agent.md            # Topology, feature design & sync agent
├── skills/                                  # Task-specific agent skills & diagnostic scripts
│   └── README.md                            # Skills catalog & quick CLI usage
├── rules/                                   # Live system rules (Auto-loaded into agent runtime)
│   ├── architecture.md                      # Layering, connection lifecycles, and caching
│   ├── coding-style.md                      # {language.title()} coding style, timeouts, and completion mandates
│   ├── testing.md                           # Automated test suites & zero residue verification
│   ├── git.md                               # Commit approvals & versioning mandates
│   ├── security.md                          # Secret hygiene & credentials protection
│   └── no_drift_clarification.md            # Zero drift, halt-on-uncertainty & clarification rules
├── context/                                 # Static project & domain background
│   ├── project.md                           # Technology stack ({framework}, {language}) & infrastructure
│   ├── domain.md                            # Core business domain concepts & ontology
│   └── glossary.md                          # Domain and technical terminology
├── memory/                                  # Deep subsystem domain specifications
{chr(10).join([f'│   ├── {s.strip().lower()}_spec.md' for s in subsystems])}
│   └── domain_boundaries.md                 # Cross-subsystem contracts and interfaces
├── checklists/                              # Operational checklists
│   └── pre-commit.md                        # Mandatory pre-commit verification steps
└── workflows/                               # Actionable step-by-step developer guides
    ├── development_workflow.md              # Feature implementation & verification lifecycle
    └── documentation_workflow.md            # Mandatory documentation synchronization guide
```

---

## 2. 🧭 Navigation & Subsystem Index

Before modifying code or implementing new features, consult the corresponding agent, skill, rule, or workflow:

| Domain / Task | Specialized Agent (`agents/`) | Linked Skill (`skills/`) | System Rule (`rules/`) | Actionable Workflow (`workflows/`) |
| :--- | :--- | :--- | :--- | :--- |
{routing_table}
| **System Architecture** | [system_architect_agent.md](file:///./.agents/agents/system_architect_agent.md) | [system-architect](file:///./.agents/skills/system-architect/SKILL.md) | [architecture.md](file:///./.agents/rules/architecture.md) | [/documentation_workflow](file:///./.agents/workflows/documentation_workflow.md) |
| **Testing & Verify** | [test_verification_agent.md](file:///./.agents/agents/test_verification_agent.md) | [test-verification](file:///./.agents/skills/test-verification/SKILL.md) | [testing.md](file:///./.agents/rules/testing.md) | [pre-commit.md](file:///./.agents/checklists/pre-commit.md) |

---

## 3. 🔄 Mandatory Synchronization Rule

**Every Implementation Plan Application MUST Synchronize Documentation in the Same Turn:**
Whenever modifying application logic, endpoints, or data models, the developer agent **MUST** update:
1. The affected directory `README.md` (e.g. `src/auth/README.md`).
2. The corresponding memory file in `.agents/memory/` or rule in `.agents/rules/`.
3. The corresponding workflow in `.agents/workflows/`.
*(See [/documentation_workflow](file:///./.agents/workflows/documentation_workflow.md) for the full matrix).*

---

## 4. 📋 Implementation Plan Standard

Every non-trivial code modification requires an `implementation_plan.md` artifact with user review:
1. **Empirical Diagnostic Findings**: Root-cause analysis from logs, state, or payload spec.
2. **Dependency Propagation Matrix**: Upstream/downstream tracing across modules, stores, and tests.
3. **Detailed Component Changes**: Grouped by file with explicit signatures and call site updates.
4. **Rigorous Empirical Verification**: Automated syntax check (`{profile['compile_cmd']}`), unit test execution (`{profile['test_cmd']}`), and lint validation.

---

## 5. 🛑 Zero Drift & Immediate Clarification Mandate (Anti-Drift Protocol)

**Strict Enforcement**: If the AI assistant cannot find the required information, loses track of the task, or becomes uncertain about what to do next, **it MUST NOT drift, guess, or continue searching aimlessly across the machine**.

- **Stop Immediately**: The assistant must halt exploratory tool loops and ask the user directly for clarification or the missing information before proceeding.
- **Context & Efficiency Hygiene**: Avoid unnecessary searching, repeatedly scanning files or systems, and overloading the context with irrelevant information.
"""


def build_coding_style_rule(language: str) -> str:
    profile = LANGUAGE_PROFILES.get(language.lower(), LANGUAGE_PROFILES["python"])
    return f"""# Coding Style & Quality Guidelines

## 1. General Engineering Principles
- **Language**: {language.title()}
- **Zero Stub Policy**: {profile['anti_stub_rule']}
- **Strict Timeouts**: {profile['timeout_rule']}
- **Defensive Typing**: All public functions and API boundaries must be strictly typed.

## 2. Compilation & Linting Commands
- **Syntax Check**: `{profile['compile_cmd']}`
- **Test Suite**: `{profile['test_cmd']}`
- **Lint Check**: `{profile['lint_cmd']}`
- **Type Check**: `{profile['type_cmd']}`

## 3. Surgical Code Editing Mandate
- Never re-write entire files when changing small logic blocks.
- Always use line-bounded replacement tools with sufficient context matching.
- Preserve unrelated comments, docstrings, and existing helper methods.
"""


def build_testing_rule(language: str) -> str:
    profile = LANGUAGE_PROFILES.get(language.lower(), LANGUAGE_PROFILES["python"])
    return f"""# Automated Testing & Verification Rules

## 1. Verification Requirements
Every change to application code must be backed by automated test coverage:
1. Syntax validation: `{profile['compile_cmd']}`
2. Unit test execution: `{profile['test_cmd']}`

## 2. Zero Residue Policy
- Tests must never leave persistent records in shared, staging, or production databases.
- Always use isolated in-memory test databases or deterministic tear-down routines.
- Never write test files into root production directories.
"""


def build_git_rule() -> str:
    return """# Git & Deployment Mandates

## 1. User Confirmation Mandate
The AI assistant must NEVER execute `git push`, branch merges, or destructive git operations without explicit user approval.

## 2. Post-Implementation Options
At the conclusion of verified changes, the assistant must present the user with 3 clear options:
1. Push to development branch
2. Push to development and merge into main
3. Do nothing (keep working tree local)

## 3. Clean Commits
- Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
- Keep commit messages concise and descriptive.
"""


def build_security_rule() -> str:
    return """# Security & Secret Management Rules

## 1. Zero Secret Exposure
- Never print, log, or commit private API keys, bearer tokens, or database passwords.
- Always read secrets from environment variables or secure credential vaults.

## 2. Input Sanitization
- All client-supplied payloads must be strictly validated at the API boundary using typed schemas.
- Prevent SQL injection, XSS, and path traversal vulnerabilities.
"""


def build_anti_drift_rule() -> str:
    return """# Zero Drift & Immediate Clarification Mandate

## 1. The Anti-Drift Rule
When an AI assistant encounters missing files, ambiguous requirements, or conflicting instructions:
- **DO NOT** continue searching aimlessly across the file system.
- **DO NOT** guess or make broad assumptions on critical business logic.
- **HALT IMMEDIATELY** and ask the user directly for clarification.

## 2. Context Hygiene
- Avoid running repetitive, broad search queries that flood the context window with megabytes of text.
- Prioritize reading curated `.agents/memory/` and `.agents/rules/` documents over scanning raw code files.
"""


def build_architecture_rule(framework: str, language: str) -> str:
    return f"""# Architecture & Subsystem Boundaries

## 1. Architectural Style
- **Stack**: {framework} ({language.title()})
- **Pattern**: Layered Clean Architecture (Transport / Routing -> Service Domain Logic -> Repository / Storage).

## 2. Subsystem Boundaries
- Handlers / Controllers handle HTTP transport and request parsing only.
- Business logic lives in domain service modules.
- Storage operations are encapsulated in repository layers with connection pooling.

## 3. Living Documentation
- If an endpoint signature or data model changes, update the corresponding `README.md` and `.agents/memory/` spec in the same turn.
"""


def build_persona_file(subsystem: str, language: str) -> str:
    clean = subsystem.strip().lower().replace(" ", "_")
    title = clean.replace("_", " ").title()
    return f"""# {title} Specialist Agent (`{clean}_agent.md`)

## 1. Role & Responsibilities
You are the **{title} Specialist Agent**. You own the architecture, logic, schemas, and verification for the `{title}` subsystem.

## 2. Codebase Ownership & Scope
- **Source Paths**:
  - `src/{clean}/` (or equivalent module directory)
- **Unit Tests**:
  - `tests/{clean}/` or `tests/unit/test_{clean}*.`

## 3. Specialist Directives
1. **Domain Integrity**: Protect the business logic and algorithms defined in `.agents/memory/{clean}_spec.md`.
2. **Same-Turn Sync**: When modifying this module, always update `src/{clean}/README.md` and `.agents/memory/{clean}_spec.md`.
3. **Verification**: Run tests using the standard test runner before completing tasks.
"""


def build_memory_spec(subsystem: str) -> str:
    clean = subsystem.strip().lower().replace(" ", "_")
    title = clean.replace("_", " ").title()
    return f"""# {title} Subsystem Specification (`{clean}_spec.md`)

## 1. Overview & Purpose
This document provides the exhaustive specification for the **{title} Subsystem**. AI coding assistants consult this document to understand formulas, data schemas, and edge cases without reading raw code files.

---

## 2. Core Business Logic & Algorithms
- **Primary Workflows**: Describe the sequence of operations.
- **Scoring / Math / Transformation Rules**: Document exact mathematical formulas and conditions.

---

## 3. Data Schemas & State Contracts
- **Input Entities**: Key fields and validation constraints.
- **Output Entities**: Return shapes and error statuses.

---

## 4. Known Edge Cases & Vendor Quirks
- Known failure modes, retry policies, and timeout considerations.
"""


def build_workflow_dev() -> str:
    return """# Feature Development & Implementation Workflow

1. **Understand & Inspect**:
   - Check `AGENTS.md` to identify the responsible agent and linked memory documents.
   - Read relevant `.agents/memory/` specs.
   - Perform surgical line-bounded reads on target source code.

2. **Draft Implementation Plan**:
   - Create `implementation_plan.md` artifact.
   - Obtain user feedback and approval.

3. **Execute Changes**:
   - Modify target files surgically.
   - Maintain zero stub policy.

4. **Verify Rigorously**:
   - Run syntax compilation check.
   - Run automated unit test suite.

5. **Mandatory Same-Turn Synchronization**:
   - Update affected module `README.md`.
   - Update `.agents/memory/` specs.
   - Update `.agents/agents/` persona definitions.
"""


def build_workflow_doc() -> str:
    return """# Documentation Synchronization Workflow

Whenever code logic, APIs, schemas, or algorithms change, perform these updates in the exact same turn:

| Component Modified | Required Documentation Update |
| :--- | :--- |
| Endpoint / Route | Module `README.md` and API Reference |
| Database Schema | `.agents/memory/` spec and model docstrings |
| Domain Algorithm | `.agents/memory/` spec |
| New Subsystem | `.agents/AGENTS.md` index and new persona in `.agents/agents/` |
| System Rule / Policy | `.agents/rules/` |
"""


def build_pre_commit_checklist(language: str) -> str:
    profile = LANGUAGE_PROFILES.get(language.lower(), LANGUAGE_PROFILES["python"])
    return f"""# Pre-Commit & Verification Checklist

Before proposing git commits or deployment actions, verify each item:

- [ ] **Syntax Compilation**: Ran `{profile['compile_cmd']}` with 0 errors.
- [ ] **Unit Tests**: Ran `{profile['test_cmd']}` and all tests passed.
- [ ] **Documentation Sync**: Updated affected `README.md` and `.agents/memory/` documents.
- [ ] **Zero Secrets**: Confirmed zero private keys or passwords in modified files.
- [ ] **Zero Residue**: Confirmed zero leftover test databases or temporary files.
- [ ] **User Approval**: Obtained explicit user confirmation before any remote git operation.
"""


def scaffold(
    target_dir: Path,
    project_name: str,
    language: str,
    framework: str,
    subsystems: List[str],
    force: bool = False,
) -> None:
    """Executes the complete directory scaffolding and file creation."""
    agents_dir = target_dir / ".agents"
    if agents_dir.exists() and not force:
        print(f"[!] Warning: '{agents_dir}' already exists. Use --force to overwrite.")

    # Create directory tree
    subdirs = [
        agents_dir / "agents",
        agents_dir / "skills",
        agents_dir / "rules",
        agents_dir / "context",
        agents_dir / "memory",
        agents_dir / "checklists",
        agents_dir / "workflows",
    ]
    for d in subdirs:
        d.mkdir(parents=True, exist_ok=True)

    # 1. Write AGENTS.md
    (agents_dir / "AGENTS.md").write_text(
        build_agents_md(project_name, language, framework, subsystems),
        encoding="utf-8",
    )

    # 2. Write Rules
    rules_dir = agents_dir / "rules"
    (rules_dir / "coding-style.md").write_text(build_coding_style_rule(language), encoding="utf-8")
    (rules_dir / "testing.md").write_text(build_testing_rule(language), encoding="utf-8")
    (rules_dir / "git.md").write_text(build_git_rule(), encoding="utf-8")
    (rules_dir / "security.md").write_text(build_security_rule(), encoding="utf-8")
    (rules_dir / "no_drift_clarification.md").write_text(build_anti_drift_rule(), encoding="utf-8")
    (rules_dir / "architecture.md").write_text(build_architecture_rule(framework, language), encoding="utf-8")

    # 3. Write Agents (Personas)
    agents_persona_dir = agents_dir / "agents"
    (agents_persona_dir / "README.md").write_text(
        f"# AI Agent Roster & Delegation Matrix\n\nThis directory defines specialized AI Agent personas and domain boundaries for `{project_name}`.\n",
        encoding="utf-8",
    )
    for sub in subsystems:
        clean = sub.strip().lower().replace(" ", "_")
        (agents_persona_dir / f"{clean}_agent.md").write_text(
            build_persona_file(sub, language),
            encoding="utf-8",
        )
    (agents_persona_dir / "system_architect_agent.md").write_text(
        build_persona_file("system_architect", language),
        encoding="utf-8",
    )

    # 4. Write Memory specs
    memory_dir = agents_dir / "memory"
    for sub in subsystems:
        clean = sub.strip().lower().replace(" ", "_")
        (memory_dir / f"{clean}_spec.md").write_text(build_memory_spec(sub), encoding="utf-8")

    # 5. Write Context
    context_dir = agents_dir / "context"
    (context_dir / "project.md").write_text(
        f"# Project Context: {project_name}\n\n- **Language**: {language.title()}\n- **Framework**: {framework}\n",
        encoding="utf-8",
    )
    (context_dir / "domain.md").write_text(
        f"# Business Domain Overview: {project_name}\n\nDescribe core business concepts and domain models here.\n",
        encoding="utf-8",
    )
    (context_dir / "glossary.md").write_text(
        f"# Terminology & Glossary: {project_name}\n\nDefine domain-specific abbreviations and technical terms.\n",
        encoding="utf-8",
    )

    # 6. Write Workflows
    workflows_dir = agents_dir / "workflows"
    (workflows_dir / "development_workflow.md").write_text(build_workflow_dev(), encoding="utf-8")
    (workflows_dir / "documentation_workflow.md").write_text(build_workflow_doc(), encoding="utf-8")

    # 7. Write Checklists
    checklists_dir = agents_dir / "checklists"
    (checklists_dir / "pre-commit.md").write_text(build_pre_commit_checklist(language), encoding="utf-8")

    # 8. Skills directory placeholder
    (agents_dir / "skills" / "README.md").write_text(
        "# Agent Skills Directory\n\nPlace task-specific executable agent skills here (each in `<skill-name>/SKILL.md`).\n",
        encoding="utf-8",
    )

    print(f"\n[+] Successfully scaffolded document-driven agent architecture in '{agents_dir}'!")
    print(f"    - Executive Index: {agents_dir / 'AGENTS.md'}")
    print(f"    - Subsystems: {len(subsystems)} ({', '.join(subsystems)})")
    print(f"    - Language Profile: {language} ({framework})")
    print("\nNext Steps:")
    print("1. Review and refine .agents/context/domain.md with your business domain details.")
    print("2. Populate .agents/memory/ with algorithmic specs for each subsystem.")
    print("3. Ensure your AI assistant prompt references .agents/AGENTS.md as its executive guide.")


def main():
    parser = argparse.ArgumentParser(
        description="Scaffold a Document-Driven Agent Architecture (.agents/ + AGENTS.md) for any repository.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--project", default=None, help="Project name (defaults to target directory name)")
    parser.add_argument(
        "--language",
        default="python",
        choices=list(LANGUAGE_PROFILES.keys()),
        help="Primary programming language",
    )
    parser.add_argument("--framework", default="standard", help="Framework (e.g. fastapi, nextjs, react, springboot)")
    parser.add_argument("--type", default="backend", help="Project type (backend, frontend, fullstack, microservice)")
    parser.add_argument("--subsystems", default="api,auth,database,core_domain", help="Comma-separated subsystem names")
    parser.add_argument("--target", default=".", help="Target repository root directory")
    parser.add_argument("--force", action="store_true", help="Overwrite existing .agents/ directory")

    args = parser.parse_args()

    target_path = Path(args.target).resolve()
    project_name = args.project or target_path.name
    subsystem_list = [s.strip() for s in args.subsystems.split(",") if s.strip()]

    scaffold(
        target_dir=target_path,
        project_name=project_name,
        language=args.language,
        framework=args.framework,
        subsystems=subsystem_list,
        force=args.force,
    )


if __name__ == "__main__":
    main()
