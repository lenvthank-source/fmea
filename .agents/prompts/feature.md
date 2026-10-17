# Feature Implementation Prompt

When implementing a new feature:

1. **Inspect first**: Read relevant source files before writing any code
2. **Use repository evidence**: Base decisions on actual codebase patterns
3. **Load minimal context**: Only load `.agents/` files relevant to the task
4. **Follow existing patterns**: Match the module's controller/service/DTO structure
5. **Avoid assumptions**: If unsure about a pattern, read the source
6. **State uncertainty**: Mark unknowns explicitly rather than guessing
7. **Ensure tenant isolation**: Every query must filter by `tenantId`
8. **Validate inputs**: Add DTO validation for new fields
9. **Check RBAC**: Add appropriate `@Permissions()` decorators
10. **Make minimal changes**: Don't refactor unrelated code
11. **Test changes**: Run `npm run build` in affected project(s)
12. **Review the diff**: Check for unused imports, unintended changes
