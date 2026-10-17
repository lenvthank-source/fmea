# Refactor Workflow

1. **Establish existing behavior**: Read current implementation thoroughly
2. **Verify tests exist**: Check for test coverage before refactoring
3. **Analyze dependencies**: Which files import/depend on the target?
4. **Make minimal structural changes**: Prefer incremental refactoring
5. **Preserve behavior**: No functional changes unless explicitly requested
6. **Run tests**: `cd backend && npm test`
7. **Build verification**:
   ```bash
   cd backend && npm run build
   cd frontend && npm run build
   ```
8. **Review dependency changes**: Ensure no circular imports introduced
