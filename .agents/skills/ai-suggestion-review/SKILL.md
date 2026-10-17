---
name: "AI Suggestion Review Lifecycle"
description: "Manages human-in-the-loop validation, acceptance, modification, and rejection of AI FMEA recommendations."
---

# AI Suggestion Review Lifecycle Skill

This skill governs the review, edits, and application of AI-generated suggestions to live FMEA rows.

## 1. Suggestion Workflow
1. **Proposal**: Copilot writes suggestions to the `ai_suggestion` table as `proposed`.
2. **Reviewing**: Suggestions appear in the UI sidebar showing confidence score, rationale, and sources.
3. **Application**:
   - **Accept**: System copies proposed values directly to the active FMEA row; status becomes `accepted`.
   - **Edit & Accept**: QE modifies the suggestion text on the form, then applies; status becomes `accepted_modified`.
   - **Reject**: User rejects suggestion; status becomes `rejected` and the user logs a rejection reason for model fine-tuning.
   - **Expire**: Daily cron job auto-expires proposed suggestions older than 30 days to status `expired`.

## 2. Integrity Rules
- **Human-in-the-loop**: Suggestions must never write directly to FMEA document schemas without user consent.
- **Safety Gate & Guardrail Rules (Agent 7 Rules)**:
  - *Safety Criticality*: If the failure mode links to a safety-critical effect, the Severity rating must be suggested as ≥ 8.
  - *S/O/D Bounds*: suggested ratings must strictly reside in [1, 10].
  - *Action Priority (AP) Sync*: Calculated AP must strictly match lookup logic.
  - *Source Citations*: Suggestions must link to valid source documents (`ai_suggestion_reference`) to prevent hallucinated references.
  - *Categorization*: Prevention/detection controls must be categorized correctly.
- **Confidence Gate**: Suggestions with confidence scores below 0.3 require highlighted UI warnings.
- **AI Model Traceability**: Every suggestion logs `created_by_model` tracking the model version, temperature, and tokens used.

## 3. Key Database Tables
- `ai_suggestion`: Stores prompt context, suggestions JSON, status (`proposed`, `accepted`, `accepted_modified`, `rejected`, `expired`), confidence score, and LLM metadata.
- `ai_suggestion_reference`: Junction table linking suggestions to historical reference document IDs.
- `pfmea_row` / `dfmea_row`: Targets for accepting suggestions.

## 4. API Endpoints
- `GET /api/v1/revisions/:revisionId/suggestions` — Fetch active suggestions.
- `PATCH /api/v1/suggestions/:suggestionId/accept` — Apply proposed values (updates status to `accepted` or `accepted_modified`).
- `PATCH /api/v1/suggestions/:suggestionId/reject` — Hide suggestion and log rejection comments (updates status to `rejected`).

## 5. Related Skills
- `vector-indexing`: RAG similarity queries generate the suggestions input payload.
- `fmea-authoring`: Target workspace interface for displaying and applying suggestions.
