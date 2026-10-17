# Zero Drift & Immediate Clarification Mandate

## 1. The Anti-Drift Protocol

### 1.1 Problem Statement
When autonomous AI agents encounter ambiguity, missing file paths, or unclear requirements, they are prone to:
1. **Unbounded Exploratory Loops**: Indiscriminately searching, grepping, or listing file trees across the entire file system.
2. **Context Saturation**: Overloading the conversation window with irrelevant file dumps, leading to context degradation and hallucinations.
3. **Guessing Architectural Decisions**: Making silent, unverified assumptions about business domain logic, schemas, or deployment environments.

### 1.2 The Absolute Rule
> [!CAUTION]
> **Halt on Uncertainty**: If the agent cannot find the required information, encounters contradictory requirements, or is unsure of the user's architectural intent, **it MUST NOT drift, guess, or continue searching aimlessly**.

1. **Immediate Halt**: Stop executing background searches and exploratory commands immediately.
2. **Surface Clarification Prompt**: Formulate a clear, direct, and concise question to the user outlining:
   - What specific information is missing or ambiguous.
   - The concrete options or alternative paths considered.
   - The architectural trade-offs of each option.
3. **No Speculative Modifications**: Never write, modify, or delete production code based on speculative assumptions.

---

## 2. Zero Concrete Entity Examples Rule (Strict Abstract Schema Mandate)

### 2.1 Problem Statement
Fast and flash LLMs latch onto concrete entities present in prompt examples (e.g. `(e.g., 'Brake Caliper', 2026, 'Titanium Bolt')`) and regurgitate them into user responses or generated artifacts regardless of the actual user data.

### 2.2 Rule & Enforcement
- All system prompts, skill templates, and developer instructions **MUST NEVER** include concrete real-world entities in examples.
- **Always use abstract schema placeholders**:
  - `[Primary Component]`
  - `[Specific Process Step]`
  - `[Failure Mode Category]`
  - `[Target Parameter Range]`
  - `[Assigned Role]`

---

## 3. Context & Efficiency Hygiene

- **Surgical Code Reading**: Always use line-bounded slice tools (`StartLine` and `EndLine` within 30–80 lines) rather than dumping 800+ lines of raw code.
- **Single Source of Truth**: Consult `.agents/memory/` and `.agents/context/` before reading raw source code.
- **Zero Test Residue**: Automated tests must never persist records in production or staging database environments. Always use clean transactions, in-memory mocks, or deterministic `afterEach` tear-down routines.
