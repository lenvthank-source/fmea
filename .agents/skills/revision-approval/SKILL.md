---
name: "Document Revision Submission, Review, and Approval"
description: "Controls the FMEA document lifecycle, reviewer segregation, 21 CFR Part 11 signatures, and immutable revisions."
---

# Document Revision Submission, Review, and Approval Skill

This skill governs the compliance, transitions, and auditing of FMEA revisions from creation to final approval sign-off.

## 1. Flow Details
1. **Draft**: Revision created. Quality engineers edit PFD/FMEA/CP rows.
2. **InReview**: Submitted for approvals. Writes are blocked except for comments/reviews.
3. **ChangesRequested**: Reviewers request changes. Status reverts to `Draft` for rework. Can be re-submitted (`ChangesRequested` → `InReview`).
4. **Approved**: All designated approvers sign off. Content is finalized.
5. **Locked**: Approved revisions are locked (setting `locked_at` timestamp), making the revision content entirely read-only.
6. **Superseded**: A new revision is approved, deprecating the older one.

## 2. Integrity Rules
- **Prerequisite Check**: Submission requires a passed consistency and coverage check.
- **Segregation of Duties**: A user cannot approve a revision they authored.
- **Approver Count**: Minimum 1 reviewer and 1 approver (configurable per tenant) must sign off.
- **21 CFR Part 11 Compliance**: Approvals must record user name, timestamp, digital signature verification hash, and decision comment.
- **Audit Trails**: All status mutations must write to the partitioned `audit_log` database table. No UPDATE or DELETE operations are allowed on the `audit_log` table (immutability constraint).

## 3. Key Database Tables
- `document`: Master FMEA document record.
- `document_revision`: Tracks revision numbering and status (`draft`, `in_review`, `changes_requested`, `approved`, `superseded`, `archived`).
- `approval`: Captures digital signatures, comments, and reviewer/approver role links.
- `audit_log`: Partitioned history logging all mutations with signatures.

## 4. API Endpoints
- `POST /api/v1/revisions/:revisionId/submit` — Submit a draft revision for review.
- `POST /api/v1/revisions/:revisionId/approve` — Reviewer/Approver digital sign-off.
- `POST /api/v1/revisions/:revisionId/lock` — Lock an approved revision (sets `locked_at` and enforces immutability).

## 5. Related Skills
- `fmea-authoring`: Step 7 results in revision submissions.
- `vector-indexing`: Revision approval triggers asynchronous indexing pipeline.
