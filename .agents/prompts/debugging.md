# Debugging Prompt

When debugging an issue:

1. **Reproduce**: Understand the exact error message, stack trace, or unexpected behavior
2. **Locate**: Identify the backend module and/or frontend feature involved
3. **Trace**: Follow the data flow from controller → service → Prisma query
4. **Check common causes**:
   - Missing `tenantId` in query (cross-tenant data leak)
   - Wrong user ID extraction (`user.sub` vs `user.id` vs `user.userId`)
   - Missing `@Public()` on endpoint (401 on public routes)
   - DTO validation stripping fields (`forbidNonWhitelisted: true`)
   - Locked revision blocking mutations
   - TypeScript build errors (unused imports with `noUnusedLocals: true`)
5. **Fix**: Make the smallest change that resolves the issue
6. **Verify**: Run build commands and check for compilation errors
7. **Document**: If the bug reveals a pattern, note it for future reference
