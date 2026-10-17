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

## Deployment Trigger

- **Frontend**: Cloudflare Pages auto-deploys from `main` branch push
- **Backend**: Render auto-deploys from `main` branch push (Docker build)
- Source: [deployment_guide.md](file:///f:/proj-fmea/deployment_guide.md)
