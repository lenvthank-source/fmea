# Domain Algorithms & Risk Evaluation Specification (`domain_algorithms.md`)

This specification documents the authoritative mathematical formulas, evaluation matrices, and structural consistency rules governing FMEA risk calculations on the platform.

---

## 1. Risk Evaluation Dimensions (S / O / D)

All risk ratings strictly occupy the integer range **[1, 10]**. Floating point numbers or values outside this range are rejected by schema validators.

| Dimension | Symbol | Scale Range | Definition | Evaluation Criterion |
| :--- | :---: | :---: | :--- | :--- |
| **Severity** | **S** | 1 – 10 | Impact of the failure effect on customer, downstream process, or regulatory compliance. | 10 = Warning without safety compliance; 1 = No perceptible effect. |
| **Occurrence** | **O** | 1 – 10 | Likelihood that the root cause occurs during the life cycle of the process/product. | 10 = Very high (frequent failures); 1 = Very low (prevention controls eliminate cause). |
| **Detection** | **D** | 1 – 10 | Ability of existing detection controls to detect the failure mode or cause prior to shipment. | 10 = Cannot detect / no inspection; 1 = Almost certain automated detection. |

---

## 2. Action Priority (AP) Computation Logic (AIAG-VDA 2019)

Action Priority replaces the legacy Risk Priority Number ($RPN = S \times O \times D$) as the primary prioritization standard.
- **Read-Only**: AP is derived exclusively through deterministic table lookups and **CANNOT** be manually overridden.
- **Priority Classes**:
  - **High (H)**: Highest priority for review and corrective action. Corrective action tracking is mandatory.
  - **Medium (M)**: Medium priority. Actions should be considered to reduce occurrence or enhance detection.
  - **Low (L)**: Low priority. Optimization is optional or at team discretion.

### AIAG-VDA 2019 AP Decision Hierarchy:
1. **Severity 9 – 10 (Safety / Regulatory Impact)**:
   - If Occurrence is High (8–10) $\rightarrow$ **High (H)** regardless of Detection.
   - If Occurrence is Moderate (4–7):
     - Detection 5–10 $\rightarrow$ **High (H)**
     - Detection 2–4 $\rightarrow$ **Medium (M)**
     - Detection 1 $\rightarrow$ **Low (L)**
   - If Occurrence is Low (2–3):
     - Detection 7–10 $\rightarrow$ **High (H)**
     - Detection 5–6 $\rightarrow$ **Medium (M)**
     - Detection 1–4 $\rightarrow$ **Low (L)**
   - If Occurrence is 1:
     - Detection 8–10 $\rightarrow$ **Medium (M)**
     - Detection 1–7 $\rightarrow$ **Low (L)**

2. **Severity 7 – 8 (High Customer Dissatisfaction / Function Loss)**:
   - If Occurrence 8–10:
     - Detection 2–10 $\rightarrow$ **High (H)**
     - Detection 1 $\rightarrow$ **Medium (M)**
   - If Occurrence 6–7:
     - Detection 5–10 $\rightarrow$ **High (H)**
     - Detection 2–4 $\rightarrow$ **Medium (M)**
     - Detection 1 $\rightarrow$ **Low (L)**
   - If Occurrence 4–5:
     - Detection 7–10 $\rightarrow$ **High (H)**
     - Detection 3–6 $\rightarrow$ **Medium (M)**
     - Detection 1–2 $\rightarrow$ **Low (L)**
   - If Occurrence 2–3:
     - Detection 5–10 $\rightarrow$ **Medium (M)**
     - Detection 1–4 $\rightarrow$ **Low (L)**
   - If Occurrence 1 $\rightarrow$ **Low (L)**

3. **Severity 4 – 6 (Moderate Impact)**:
   - High only when Occurrence is 8–10 and Detection is 5–10.
   - Medium when Occurrence is 6–7 and Detection 5–10, or Occurrence 8–10 and Detection 1–4.
   - Low in other cases.

4. **Severity 1 – 3 (Low / Imperceptible Impact)**:
   - Always **Low (L)** regardless of Occurrence and Detection ratings.

---

## 3. Severity Inheritance Rule

A single FMEA analysis row may have multiple associated failure effects.
- **Rule**: The effective severity $S_{\text{row}}$ of the FMEA row is strictly inherited from the **maximum severity** across all associated failure effects:
$$S_{\text{row}} = \max_{e \in \text{Effects}} (S_e)$$
- Modifying or adding a failure effect dynamically recalculates $S_{\text{row}}$ and re-triggers the Action Priority evaluation.

---

## 4. Failure Chain Completeness Rules

Every valid FMEA quality record must satisfy structural completeness constraints:
1. **At Least One Effect**: Every failure mode must link to $\ge 1$ failure effect.
2. **At Least One Cause**: Every failure mode must link to $\ge 1$ failure cause.
3. **Control Linkage**: Every failure cause must link to $\ge 1$ prevention control OR $\ge 1$ detection control.
4. **Orphan Prevention**: Deleting a parent node in the structure tree flags or cascades linked child nodes in a single serializable transaction.

---

## 5. 7-Step Workflow Gating Matrix

| Step | Phase Name | Entry Prerequisites | Enforced Output Artifact |
| :---: | :--- | :--- | :--- |
| **1** | **Planning (5Ts)** | Project initialized with tenant and team. | Scope, In-Scope / Out-of-Scope boundaries, 5Ts. |
| **2** | **Structure Analysis** | Step 1 Complete; BOM or PFD defined. | Process Item $\rightarrow$ Process Step $\rightarrow$ Work Element hierarchy. |
| **3** | **Function Analysis** | Step 2 Complete. | Item Functions $\rightarrow$ Process Functions $\rightarrow$ Work Element Functions. |
| **4** | **Failure Analysis** | Step 3 Complete. | Failure Effect $\leftarrow$ Failure Mode $\leftarrow$ Failure Cause chains. |
| **5** | **Risk Analysis** | Step 4 Complete. | S, O, D ratings evaluated; AP (H/M/L) calculated. |
| **6** | **Optimization** | Step 5 Complete; High AP rows tracked. | Corrective actions assigned with owner and due date. |
| **7** | **Documentation** | Step 6 Verified; evidence attached. | Locked revision with 21 CFR Part 11 digital signatures. |
