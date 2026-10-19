#!/usr/bin/env python3
"""
Universal Multi-Harness Context Handoff CLI
Synchronizes session state across Google Antigravity, OpenAI Codex, Claude Code, Cursor, and VS Code.

Usage:
  python .agents/scripts/handoff.py --status
  python .agents/scripts/handoff.py --update "Overhauled Excel showcase to light enterprise" --next "Verify production DB RLS"
  python .agents/scripts/handoff.py --check
  python .agents/scripts/handoff.py --generate-bridges
"""

import argparse
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

# Fix Windows console encoding for UTF-8 symbols
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parents[2]
ACTIVE_STATE = ROOT / ".agents" / "ACTIVE_STATE.md"
BLACKBOARD = ROOT / ".agents" / "memory" / "blackboard.md"
PKG_ROOT = ROOT / "package.json"
PKG_BACKEND = ROOT / "backend" / "package.json"
PKG_FRONTEND = ROOT / "frontend" / "package.json"

BRIDGE_FILES = {
    "AGENTS.md": ROOT / "AGENTS.md",
    "CODEX.md": ROOT / "CODEX.md",
    "CLAUDE.md": ROOT / "CLAUDE.md",
    ".cursorrules": ROOT / ".cursorrules",
    ".github/copilot-instructions.md": ROOT / ".github" / "copilot-instructions.md",
    "GEMINI.md": ROOT / "GEMINI.md",
}

GRAPH_REPORT = ROOT / "graphify-out" / "GRAPH_REPORT.md"
GRAPH_JSON = ROOT / "graphify-out" / "graph.json"



def get_git_info():
    """Retrieve current git branch, commit hash, and dirty status."""
    try:
        branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        branch = "unknown"

    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        commit = "unknown"

    try:
        status = subprocess.check_output(
            ["git", "status", "--porcelain"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL
        ).strip()
        dirty = bool(status)
    except Exception:
        dirty = False

    return branch, commit, dirty


def read_json_version(path: Path) -> str:
    """Read version field from a package.json file."""
    if not path.exists():
        return "missing"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data.get("version", "unknown")
    except Exception:
        return "error"


def print_status():
    """Print high-density executive status dashboard."""
    print("=" * 70)
    print("  FMEApex Quality Platform — Universal Multi-Harness State Hub")
    print("=" * 70)

    if not ACTIVE_STATE.exists():
        print("❌ Error: .agents/ACTIVE_STATE.md not found!")
        return 1

    content = ACTIVE_STATE.read_text(encoding="utf-8")
    branch, commit, dirty = get_git_info()
    v_root = read_json_version(PKG_ROOT)

    dirty_tag = " (DIRTY WORKING TREE)" if dirty else " (CLEAN)"
    print(f"📍 Version:     v{v_root}")
    print(f"🌿 Git Status:  {branch} @ {commit}{dirty_tag}")

    # Extract Graphify Knowledge Graph status
    if GRAPH_REPORT.exists():
        rpt_text = GRAPH_REPORT.read_text(encoding="utf-8")
        sum_m = re.search(r"## Summary\s*\n+- ([^\n]+)", rpt_text)
        fresh_m = re.search(r"## Graph Freshness\s*\n+- Built from commit:\s*`([^`]+)`", rpt_text)
        graph_summary = sum_m.group(1).strip() if sum_m else "Graph active"
        graph_commit = f" (built from `{fresh_m.group(1)}`)" if fresh_m else ""
        print(f"🕸️  Knowledge:  {graph_summary}{graph_commit}")
    else:
        print("🕸️  Knowledge:  graphify-out/ missing (run: graphify update .)")

    # Extract sections from ACTIVE_STATE.md
    goal_m = re.search(r"## 🎯 1\. Project North Star & Main Final Goal\s*\n+### The Mission\s*\n+([^\n]+)", content)
    if goal_m:
        print(f"🎯 North Star:  {goal_m.group(1).strip()[:75]}...")

    task_m = re.search(r"## ⚡ 4\. Active In-Flight Task\s*\n+- \*\*Task Name\*\*:\s*([^\n]+)", content)
    if task_m:
        print(f"⚡ Active Task: {task_m.group(1).strip()}")

    # Extract where we left off summary
    left_m = re.search(r"## 🕒 3\. Where We Left Off.*?\n+(?:In the most recent engineering session.*?:)?(.*?)(?=## ⚡|\Z)", content, re.DOTALL)
    if left_m:
        lines = [line.strip() for line in left_m.group(1).splitlines() if line.strip() and (line.strip().startswith("-") or re.match(r"^\d+\.", line.strip()))]
        if lines:
            print("\n🕒 Where We Left Off (Recent Accomplishments):")
            for line in lines[:4]:
                print(f"   {line[:80]}")

    # Extract pending items from checklist
    backlog_m = re.search(r"## 📋 5\. What Is Left.*?\n(.*?)(?=## 🤝|\Z)", content, re.DOTALL)
    if backlog_m:
        pending = [line.strip() for line in backlog_m.group(1).splitlines() if "- [ ]" in line]
        if pending:
            print("\n📋 Next Remaining Tasks:")
            for item in pending[:4]:
                clean_item = item.replace("- [ ]", "•").strip()
                print(f"   {clean_item[:80]}")

    print("=" * 70)
    print("💡 Harness Guide:")
    print("   OpenAI Codex: read CODEX.md & .agents/ACTIVE_STATE.md")
    print("   Antigravity:  read .agents/AGENTS.md & .agents/ACTIVE_STATE.md")
    print("   Update State: python .agents/scripts/handoff.py --update \"...\" --next \"...\"")
    print("=" * 70)
    return 0


def update_state(summary: str, next_task: str, harness: str = "Multi-Harness", run_graph: bool = False):
    """Update .agents/ACTIVE_STATE.md with new accomplishments and next task."""
    if not ACTIVE_STATE.exists():
        print(f"❌ Error: {ACTIVE_STATE} not found!")
        return 1

    content = ACTIVE_STATE.read_text(encoding="utf-8")
    now_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    branch, commit, _ = get_git_info()
    v_root = read_json_version(PKG_ROOT)

    # 1. Update header metadata
    content = re.sub(r"\*\*Last Updated\*\*:\s*[^\n]+", f"**Last Updated**: {now_iso}", content)
    content = re.sub(r"\*\*Active Harness\*\*:\s*[^\n]+", f"**Active Harness**: {harness}", content)
    content = re.sub(r"\*\*Latest Commit\*\*:\s*[^\n]+", f"**Latest Commit**: `{commit}` on `{branch}`", content)

    # 2. Update Where We Left Off
    new_recent_entry = (
        f"In the most recent engineering session (**{now_iso} via {harness}**):\n"
        f"1. **Accomplished**: {summary}\n"
        f"2. **Commit**: `{commit}` on `{branch}` (v{v_root})\n"
    )
    content = re.sub(
        r"(## 🕒 3\. Where We Left Off \(Last Session Summary\)\s*\n+)(.*?)(?=## ⚡|\Z)",
        r"\1" + new_recent_entry + "\n",
        content,
        flags=re.DOTALL,
    )

    # 3. Update Active In-Flight Task
    new_in_flight = (
        f"- **Task Name**: {next_task}\n"
        f"- **Updated By**: {harness} at {now_iso}\n"
        f"- **Status**: In-Progress\n"
    )
    content = re.sub(
        r"(## ⚡ 4\. Active In-Flight Task\s*\n+)(.*?)(?=## 📋|\Z)",
        r"\1" + new_in_flight + "\n",
        content,
        flags=re.DOTALL,
    )

    ACTIVE_STATE.write_text(content, encoding="utf-8")
    print(f"✓ Successfully updated .agents/ACTIVE_STATE.md (Harness: {harness})")

    # Optional: Update Graphify AST Knowledge Graph
    if run_graph:
        print("Re-extracting Graphify AST knowledge graph...")
        try:
            subprocess.run(["graphify", "update", "."], cwd=ROOT, check=True)
            print("✓ Graphify knowledge graph updated.")
        except Exception as e:
            print(f"⚠️ Warning: Graphify update failed: {e}")

    # Also append to blackboard.md if exists
    if BLACKBOARD.exists():
        bb_content = BLACKBOARD.read_text(encoding="utf-8")
        bb_entry = (
            f"\n## {now_iso} — {next_task[:50]} — {harness.lower()} — in_progress — priority:1\n"
            f"- owns: all\n"
            f"- artifacts: [.agents/ACTIVE_STATE.md]\n"
            f"- depends_on: []\n"
            f"> {harness.lower()} → all: Completed '{summary[:80]}'. Next focus: '{next_task[:80]}'.\n"
        )
        # Insert under ## Entries (newest first)
        if "## Entries (newest first)" in bb_content:
            bb_content = bb_content.replace(
                "## Entries (newest first)\n",
                f"## Entries (newest first)\n{bb_entry}"
            )
            BLACKBOARD.write_text(bb_content, encoding="utf-8")
            print("✓ Appended state update to .agents/memory/blackboard.md")

    return 0


def check_consistency():
    """Verify semver, file consistency, and knowledge graph across the multi-harness system."""
    print("Running multi-harness consistency checks...\n")
    errors = []

    # 1. Semver sync
    v_root = read_json_version(PKG_ROOT)
    v_backend = read_json_version(PKG_BACKEND)
    v_frontend = read_json_version(PKG_FRONTEND)

    print(f"  • Root package.json:     v{v_root}")
    print(f"  • Backend package.json:  v{v_backend}")
    print(f"  • Frontend package.json: v{v_frontend}")

    if not (v_root == v_backend == v_frontend):
        errors.append(f"Semver mismatch: root={v_root}, backend={v_backend}, frontend={v_frontend}")

    # Check ACTIVE_STATE.md version mention
    if ACTIVE_STATE.exists():
        state_text = ACTIVE_STATE.read_text(encoding="utf-8")
        if f"v{v_root}" not in state_text and f"`{v_root}`" not in state_text:
            errors.append(f".agents/ACTIVE_STATE.md does not reference current version v{v_root}")
        print("  • .agents/ACTIVE_STATE.md: PRESENT & VALID")
    else:
        errors.append("Missing .agents/ACTIVE_STATE.md")

    # 2. Check Bridge Adapters
    for name, path in BRIDGE_FILES.items():
        if path.exists() and path.stat().st_size > 0:
            print(f"  • {name}: PRESENT & VALID")
        else:
            errors.append(f"Missing or empty bridge file: {name}")

    # 3. Check Graphify Knowledge Graph
    if GRAPH_JSON.exists() and GRAPH_REPORT.exists():
        print("  • graphify-out/ (Knowledge Graph): PRESENT & VALID")
    else:
        errors.append("Missing graphify-out/graph.json or GRAPH_REPORT.md (run: graphify update .)")

    print("-" * 50)
    if errors:
        print("❌ CONSISTENCY CHECKS FAILED:")
        for err in errors:
            print(f"   - {err}")
        return 1

    print("✓ ALL MULTI-HARNESS CONSISTENCY CHECKS PASSED (100% IN SYNC)")
    return 0


def generate_bridges():
    """Ensure all harness bridge adapters exist with canonical pointers."""
    print("Ensuring canonical bridge adapters are up-to-date...")

    # CODEX.md
    codex_path = ROOT / "CODEX.md"
    if not codex_path.exists():
        codex_path.write_text(
            "# OpenAI Codex Project Guide: FMEApex Quality Platform\n\n"
            "Ground all reasoning in `.agents/AGENTS.md`.\n"
            "Check `.agents/ACTIVE_STATE.md` at session start for active project context, where we left off, in-flight task, and next backlog items.\n"
            "Run `python .agents/scripts/handoff.py --status` for executive dashboard.\n"
            "Update `.agents/ACTIVE_STATE.md` before session completion.\n",
            encoding="utf-8"
        )
        print("  ✓ Created CODEX.md")
    else:
        print("  ✓ Verified CODEX.md")

    # CLAUDE.md
    claude_path = ROOT / "CLAUDE.md"
    if not claude_path.exists():
        claude_path.write_text(
            "# Claude Code Project Guide: FMEApex Quality Platform\n\n"
            "Ground all reasoning in `.agents/AGENTS.md`.\n"
            "Check `.agents/ACTIVE_STATE.md` at session start for active project context, where we left off, in-flight task, and next backlog items.\n"
            "Run `python .agents/scripts/handoff.py --status` for executive dashboard.\n"
            "Update `.agents/ACTIVE_STATE.md` before session completion.\n",
            encoding="utf-8"
        )
        print("  ✓ Created CLAUDE.md")
    else:
        print("  ✓ Verified CLAUDE.md")

    # .cursorrules
    cursor_path = ROOT / ".cursorrules"
    if not cursor_path.exists():
        cursor_path.write_text(
            "Follow .agents/AGENTS.md and .agents/ACTIVE_STATE.md for all project context and architecture rules.\n"
            "Update .agents/ACTIVE_STATE.md before completing a session.\n",
            encoding="utf-8"
        )
        print("  ✓ Created .cursorrules")
    else:
        print("  ✓ Verified .cursorrules")

    # .github/copilot-instructions.md
    copilot_dir = ROOT / ".github"
    copilot_dir.mkdir(exist_ok=True)
    copilot_path = copilot_dir / "copilot-instructions.md"
    if not copilot_path.exists():
        copilot_path.write_text(
            "Follow .agents/AGENTS.md and .agents/ACTIVE_STATE.md for all project context and architecture rules.\n"
            "Update .agents/ACTIVE_STATE.md before completing a session.\n",
            encoding="utf-8"
        )
        print("  ✓ Created .github/copilot-instructions.md")
    else:
        print("  ✓ Verified .github/copilot-instructions.md")

    # GEMINI.md
    gemini_path = ROOT / "GEMINI.md"
    if not gemini_path.exists():
        gemini_path.write_text(
            "Follow .agents/AGENTS.md and .agents/ACTIVE_STATE.md for all project context and architecture rules.\n"
            "Update .agents/ACTIVE_STATE.md before completing a session.\n",
            encoding="utf-8"
        )
        print("  ✓ Created GEMINI.md")
    else:
        print("  ✓ Verified GEMINI.md")

    print("✓ All bridge adapters verified.")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Universal Multi-Harness Context Handoff Tool")
    parser.add_argument("--status", action="store_true", help="Display executive status dashboard")
    parser.add_argument("--update", type=str, help="Record what was accomplished in this session")
    parser.add_argument("--next", type=str, default="Continue next backlog item", help="Set the next in-flight task")
    parser.add_argument("--harness", type=str, default="Google Antigravity", help="Name of current harness (e.g. OpenAI Codex, Antigravity)")
    parser.add_argument("--graph", action="store_true", help="Re-extract and update the Graphify AST knowledge graph")
    parser.add_argument("--check", action="store_true", help="Validate semver and multi-harness file consistency")
    parser.add_argument("--generate-bridges", action="store_true", help="Generate or verify canonical bridge files")

    args = parser.parse_args()

    if args.check:
        sys.exit(check_consistency())
    elif args.generate_bridges:
        sys.exit(generate_bridges())
    elif args.update:
        sys.exit(update_state(args.update, args.next, args.harness, run_graph=args.graph))
    else:
        # Default action: print status
        sys.exit(print_status())


if __name__ == "__main__":
    main()
