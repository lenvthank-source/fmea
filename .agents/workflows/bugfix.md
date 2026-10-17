# Bugfix Workflow

1. **Understand the bug**: Reproduce or reason about the reported behavior
2. **Identify affected module**: Locate the backend module and/or frontend feature
3. **Inspect related code**: Read the service, controller, and component involved
4. **Locate root cause**: Trace the data/control flow to find the defect
5. **Check existing tests**: See if tests cover this behavior
6. **Implement smallest fix**: Minimal change that resolves the issue
7. **Add regression test**: If test infrastructure exists for the area
8. **Build verification**:
   ```bash
   cd backend && npm run build
   cd frontend && npm run build
   ```
9. **Review diff**: Ensure fix doesn't introduce side effects
