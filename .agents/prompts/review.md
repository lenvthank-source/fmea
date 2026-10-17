# Code Review Prompt

When reviewing code changes:

1. **Read the full diff** before making judgments
2. **Check tenant isolation**: All queries filter by `tenantId`?
3. **Check auth**: New routes have proper `@Permissions()` or `@Public()`?
4. **Check input validation**: New DTO fields have class-validator decorators?
5. **Check locked revisions**: Mutations check `lockedAt` constraint?
6. **Check guest access**: Guest users properly restricted from mutations?
7. **Check AP calculation**: S/O/D ratings constrained to [1,10]? AP is read-only?
8. **Look for regressions**: Does the change break existing functionality?
9. **Report findings with file references**: Link to specific files/lines
10. **Prioritize by severity**: Critical > Major > Minor > Suggestions
