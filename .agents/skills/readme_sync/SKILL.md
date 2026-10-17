---
name: readme_sync
description: Keeps directory-level README.md files up-to-date and uses them to optimize the agent's context window.
---

# README Sync and Context Optimization Skill

This skill is active for this workspace. It ensures that:
1. Every directory has a local `README.md` that describes its structure, files count, and responsibilities.
2. The agent uses these `README.md` files as directory index maps to navigate and understand code context without loading unnecessary file contents, optimizing token usage.
3. On any code modifications or new file additions, the agent runs the sync script at `.agents/skills/readme_sync/scripts/sync_readmes.py` to regenerate the directory's `README.md` file.

## Context Optimization Rules

1. **Leverage Local READMEs First**: Before reading files in a directory, read its `README.md` to identify the correct files to inspect. Avoid using broad commands/grep searches when file purposes are already mapped.
2. **Auto-Update on Change**: If you modify, add, or delete any source files, run the sync script:
   ```powershell
   python .agents/skills/readme_sync/scripts/sync_readmes.py
   ```
   Ensure the modified directories' READMEs are updated and committed before completing the task.
