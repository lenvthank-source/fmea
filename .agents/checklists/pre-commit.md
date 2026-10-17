# Pre-Commit Checklist

- [ ] `cd frontend && npm run build` passes (tsc -b && vite build)
- [ ] `cd backend && npm run build` passes (nest build)
- [ ] No unused imports (enforced by `noUnusedLocals: true`)
- [ ] No `.env` files staged
- [ ] No credentials or secrets in staged files
- [ ] Commit message follows conventional format: `type(scope): description`
- [ ] Changed files are relevant to the commit scope
