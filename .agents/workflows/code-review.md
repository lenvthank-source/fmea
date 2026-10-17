# Code Review Workflow

1. **Inspect diff**: Understand the scope and intent of changes
2. **Check architecture**: Does the change respect module boundaries?
3. **Check tenant isolation**: Every query includes `tenantId`?
4. **Check RBAC**: New endpoints have `@Permissions()` or `@Public()`?
5. **Check correctness**: Logic errors, null checks, edge cases?
6. **Check security**: Input validation, auth enforcement, no secret exposure?
7. **Check tests**: New behavior covered by tests?
8. **Check unintended changes**: Accidental file modifications, import changes?
9. **Report by severity**: Critical → Major → Minor → Suggestions
