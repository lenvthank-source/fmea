---
name: "Document Revision Submission, Review, and Approval"
description: "Maintain actual revision readiness, submission, password-confirmed approval, reviewer segregation, audit records and protected content."
---
# Revision review and approval

Inspect `backend/src/modules/project/project.controller.ts:173` and project.service.ts before changing lifecycle behavior. Rule applicability: `.agents/context/engineering-rule-register.md`.

## Implemented contract
Under `/api/v1/projects/:id/revisions/:revisionId`:
- GET `/readiness`: inspect review completeness.
- POST `/submit`: submit writable draft after readiness checks.
- POST `/approve`: authorized approver sends password/comment; creator cannot approve own revision. Approval changes status and sets lockedAt/approvedAt, stores approval record and audit event.
- POST `/reject`: authorized review decision with comment.

A separate universal `/revisions/:id/lock` route, configurable minimum reviewer/approver counts, cryptographic approval hash, and automatic vector-index job are not established by this implementation. Do not invent those capabilities or equate approval records with regulatory certification.

## Integrity
Allow incomplete drafts and revisiting analysis activities. Enforce tenant permissions, valid references, integer ratings and protected-revision restrictions immediately. Evaluate completeness before submission/approval, preserving approved content. Review checks must explain missing data instead of silently fabricating it. Results documentation is broader than locking a revision.

Audit each mutation path for RevisionGuard use; do not assume ActionService enforces full linked-revision/evidence transitions. Preserve existing audit history and separate product policies from independently verified customer/regulatory requirements.
