#!/usr/bin/env python3
"""
Portable mesh dispatcher — VS Code / Cursor / Opencode / Gemini / Antigravity / any model.

Reads .agents/context/routing.md keyword→agent table, matches against --intent,
prints per-agent prompts to stdout (copy-paste into any model's chat tab).

No deps beyond stdlib. Run from any IDE terminal:

  python .agents/scripts/dispatch.py --intent "Add PFD Excel import button" --mode plan
  python .agents/scripts/dispatch.py --intent "Fix auth 72h inactivity" --mode build --task-id abc123

Appends blackboard entries to .agents/memory/blackboard.md (file bus).
"""

import argparse
import datetime
import re
import sys
from pathlib import Path

# Fix Windows cp1252 console for unicode arrows etc. (portable mesh uses ↔ etc.)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parents[2]  # F:\proj-fmea
ROUTING = ROOT / ".agents" / "context" / "routing.md"
BLACKBOARD = ROOT / ".agents" / "memory" / "blackboard.md"


def parse_routing():
    if not ROUTING.exists():
        print(f"routing not found: {ROUTING}", file=sys.stderr)
        sys.exit(2)
    text = ROUTING.read_text(encoding="utf-8")
    rows = []
    # Parse markdown table lines containing AGENT.md
    for line in text.splitlines():
        if "AGENT.md" not in line:
            continue
        # | `keywords` | `agent` | `.agents/.../AGENT.md:1` | 1 | glob |
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 6:
            continue
        keywords = parts[1].strip("` ")
        agent = parts[2].strip("` ")
        mdref = parts[3]
        prio = parts[4].strip()
        allow = parts[5]
        rows.append({"keywords": keywords, "agent": agent, "mdref": mdref, "priority": prio, "allow": allow})
    return rows


def match_agents(intent: str, rows):
    hits = []
    for r in rows:
        raw = r["keywords"]
        # Routing table uses comma-separated keywords; convert to regex OR
        # e.g. "pfd, process flow, S/O/D" -> "pfd|process flow|S/O/D"
        # Keep existing regex fragments like "System.*Subsystem.*Component" intact.
        if "," in raw:
            parts = [p.strip() for p in raw.split(",")]
            # Build OR pattern from parts (already regex-like)
            pattern = "|".join(parts)
        else:
            pattern = raw.replace(r"\|", "|")
        # Normalize escaped slash
        pattern = pattern.replace(r"\/", "/")
        try:
            if re.search(pattern, intent, flags=re.IGNORECASE):
                hits.append(r)
        except re.error:
            for kw in pattern.split("|"):
                kw = kw.strip().lower()
                if kw and kw in intent.lower():
                    hits.append(r)
                    break
    # dedup by agent
    seen = {}
    for h in hits:
        seen[h["agent"]] = h
    # sort by priority
    ordered = sorted(seen.values(), key=lambda x: int(x["priority"]) if x["priority"].isdigit() else 9)
    return ordered


def load_agent_md(agent: str):
    # agent -> dir name mapping
    mapping = {
        "pfd-agent": "pfd",
        "pfmea-agent": "pfmea",
        "dfmea-agent": "dfmea",
        "control-plan-agent": "control-plan",
        "action-agent": "action",
        "revision-agent": "revision",
        "rag-agent": "rag",
        "auth-agent": "auth",
        "repository-agent": "repository",
        "ai-suggestion-agent": "ai-suggestion",
        "seo-agent": "seo-agent",
    }
    dirname = mapping.get(agent, agent.replace("-agent", ""))
    # try .agents/agents/<dirname>/AGENT.md then fallback to legacy json dir
    candidates = [
        ROOT / ".agents" / "agents" / dirname / "AGENT.md",
        ROOT / ".agents" / "agents" / agent / "AGENT.md",
    ]
    for p in candidates:
        if p.exists():
            return p.read_text(encoding="utf-8")
    return f"# Agent {agent}\nLoad .agents/agents/{dirname}/AGENT.md"


def main():
    ap = argparse.ArgumentParser(description="Portable mesh dispatcher")
    ap.add_argument("--intent", required=True, help="User intent / task description")
    ap.add_argument("--mode", choices=["plan", "build"], default="plan", help="plan (read-only) or build")
    ap.add_argument("--task-id", default=None, help="task id (default: timestamp)")
    ap.add_argument("--max-parallel", type=int, default=4)
    ap.add_argument("--dry-run", action="store_true", help="do not write blackboard")
    args = ap.parse_args()

    task_id = args.task_id or datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    rows = parse_routing()
    hits = match_agents(args.intent, rows)

    if not hits:
        print(f"No agent matched intent: {args.intent!r}", file=sys.stderr)
        print("Routing table:", ROUTING, file=sys.stderr)
        sys.exit(1)

    # cap
    to_run = hits[: args.max_parallel]
    queued = hits[args.max_parallel :]

    now = datetime.datetime.utcnow().isoformat() + "Z"
    print(f"# Dispatch {task_id} — mode:{args.mode} — intent: {args.intent!r}")
    print(f"# Matched {len(hits)} agents, running {len(to_run)} (max_parallel={args.max_parallel})")
    if queued:
        print(f"# Queued: {', '.join(r['agent'] for r in queued)}")

    for r in to_run:
        agent = r["agent"]
        prio = r["priority"]
        header = f"## {now} — {args.intent[:60]} — {agent} — pending — priority:{prio}"
        entry = f"{header}\n- owns: {r['allow']}\n- artifacts: []\n- depends_on: []\n"
        if not args.dry_run:
            try:
                with BLACKBOARD.open("a", encoding="utf-8") as f:
                    f.write(entry)
            except Exception as e:
                print(f"warn: blackboard write failed: {e}", file=sys.stderr)
        md = load_agent_md(agent)
        print("\n" + "=" * 72)
        print(f"### Agent: {agent} (priority {prio}) — {r['mdref']} — allow: {r['allow']}")
        print("=" * 72)
        print(f"\nCopy the block below as SYSTEM PROMPT for {agent} (then add intent slice):\n")
        print("```markdown")
        print(md[:4000])  # trim for terminal
        print("```")
        print(f"\nIntent slice ({args.mode}): {args.intent}\n")
        print(f"Bus: update {BLACKBOARD} status pending→in_progress→completed\n")

    if queued:
        print(f"\n# Queued agents (run after first batch completes): {', '.join(q['agent'] for q in queued)}")


if __name__ == "__main__":
    main()
