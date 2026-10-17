# Git Rules

## Branch Strategy

- Primary branch: `main`
- No branch protection rules configured (no `.github/` directory)
- No CI/CD pipelines configured
- UNKNOWN — whether feature branches or PRs are used in practice

## Commit Conventions

Observed commit message pattern: conventional commits style
- `feat(scope): description` for features
- `fix(scope): description` for bug fixes
- Scopes observed: `repository`, `pfmea`, `pfd`, etc.

## Gitignored Files

Key entries from [.gitignore](file:///f:/proj-fmea/.gitignore):

| Pattern | Purpose |
|---|---|
| `node_modules/` | Dependencies |
| `dist/`, `build/` | Build outputs |
| `.env`, `.env*` | Environment secrets |
| `/FMEA Credentials.txt` | Database credentials |
| `.agents/` | Agent configuration (not tracked in git) |
| `/docs/` | Architecture documentation |
| `**/README.md` (except root) | Auto-generated READMEs |
| `/package.json` | Root orchestration scripts |
| `/fmea-pod.yaml` | Container pod config |
| `/deployment_guide.md` | Deployment instructions |

## Never Commit

- `.env` files with secrets
- `FMEA Credentials.txt`
- `node_modules/`
- Build artifacts (`dist/`, `build/`)
- IDE configuration (`.vscode/`, `.idea/`)
- Python bytecode (`__pycache__/`, `*.pyc`)

## Deployment Trigger

- **Frontend**: Cloudflare Pages auto-deploys from `main` branch push
- **Backend**: Render auto-deploys from `main` branch push (Docker build)
- Source: [cloudflare-render-neon.md](file:///f:/proj-fmea/docs/deployment/cloudflare-render-neon.md)

---

## Non-Blocking Git Push Protocol (Windows / Agent Subshells)

### The Problem: Why `git push` Hangs
On Windows, Git's system configuration (`C:/Program Files/Git/etc/gitconfig`) defaults to `credential.helper = manager` (the .NET Git Credential Manager / GCM). 
When an agent or automated script runs `git push origin main` in a non-interactive background subshell:
1. GCM attempts to launch a GUI popup window, browser OAuth flow, or modal dialog.
2. In headless/subshell environments, this window cannot be rendered or focused, causing `git-credential-manager get` to block indefinitely on stdin/`/dev/tty`.
3. The background command never completes, wasting minutes in timeouts.

### The Solution: Native Windows Credential Store (`wincred`)
Windows Credential Manager already securely stores the GitHub access token under `LegacyGeneric:target=git:https://github.com`.
The native helper `git-credential-wincred.exe` directly reads these credentials synchronously without launching external GUI processes.

### Mandatory One-Time Configuration for the Repository
In Git, `credential.helper` is an ordered list. To override system-level `manager`, the list must first be reset with an empty string, then set to `wincred`:

```powershell
# Reset inherited helpers and set wincred exclusively for this repository:
git config --local --unset-all credential.helper
git config --local credential.helper ""
git config --local --add credential.helper wincred
```

Verify that it resolves instantly (should output username & token within <1s without hanging):
```powershell
"protocol=https`nhost=github.com`n`n" | git credential fill
```

### Protocol for Autonomous Agents Before Pushing
Before executing any `git push` command, agents MUST:
1. Ensure local config has `wincred` as the active helper:
   ```powershell
   git config --local credential.helper wincred
   ```
2. Set non-interactive fallback environment variables:
   ```powershell
   $env:GCM_INTERACTIVE="never"
   ```
3. Use a reasonable synchronous wait timeout (`WaitMsBeforeAsync: 10000`). Under `wincred`, push typically completes in **2–5 seconds**.
4. If a push task appears stuck in `RUNNING` for > 15 seconds:
   - Check if GCM is stuck: `Get-Process | Where-Object { $_.ProcessName -match "credential" }`
   - Immediately terminate the hanging task: `manage_task(kill)`
   - Clear and reset helper: `git config --local credential.helper ""; git config --local --add credential.helper wincred`
   - Retry the push.

