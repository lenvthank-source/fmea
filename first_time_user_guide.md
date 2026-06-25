# APEX FMEA Platform — First-Time User Guide

Welcome to the **APEX FMEA Platform**! This guide will walk you through setting up your first tenant account, creating a project, and performing risk analysis using the PFD, PFMEA, and AI Copilot suggestions.

---

## 1. Access & Authentication

### Step 1: Sign Up / Register a Tenant
The platform is multi-tenant, meaning each company or organization gets its own isolated workspace.
1. Open the application in your browser (e.g., `http://localhost:5173` locally, or your deployed Cloudflare URL).
2. On the Login screen, click **Sign Up**.
3. Fill out the registration form:
   *   **Tenant Name**: Your company or division (e.g., `Apex Automotive`).
   *   **Subdomain**: The unique workspace key (e.g., `apex-auto`).
   *   **Name**: Your full name.
   *   **Email**: Your login email.
   *   **Password**: Choose a secure password.
4. Click **Create Workspace & Account**.

### Step 2: Log In
1. Go to the login screen.
2. Enter the **Subdomain** you registered, your **Email**, and **Password**.
3. Click **Log In** to access your dashboard.

---

## 2. Setting Up Your First Project

In the APEX platform, creating a project automatically initializes the three core interlinked documents required by the **AIAG-VDA FMEA Handbook**:
1. **Process Flow Diagram (PFD)**
2. **Process FMEA (PFMEA) Sheet**
3. **Control Plan (CP)**

### Step 1: Create the Project
1. On the **Projects** dashboard, click **Create Project**.
2. Fill out the project details:
   *   **Project Name**: e.g., `Steering Knuckle Machining Line`.
   *   **Description**: e.g., `OP10 to OP50 manufacturing line for steering knuckle assembly`.
   *   **Customer**: e.g., `OEM Automotive Corp`.
   *   **Model Year**: e.g., `2026`.
3. Click **Submit**. You will see the new project appear in the list.
4. Click on your project to open the **FMEA Workspace**.

---

## 3. Creating a Process Flow Diagram (PFD)

First, define the sequence of operations for your manufacturing process.
1. Inside the project workspace, select the **Process Flow (PFD)** tab in the sidebar.
2. Click **Add Step** and enter the operation details:
   *   **Step Number**: e.g., `10`
   *   **Step Name**: e.g., `Drill core hole`
   *   **Step Type**: Select `Operation` (Other options: `Inspection`, `Transport`, `Storage`).
3. Click **Add Step** to append a second operation:
   *   **Step Number**: e.g., `20`
   *   **Step Name**: e.g., `Inspect hole diameter`
   *   **Step Type**: Select `Inspection`.
4. **Add Work Elements** (the 4Ms: Machine, Man, Material, Milieu):
   *   Click the **Expand (down arrow)** icon on `Step 10`.
   *   Click **Add Work Element**.
   *   Name it `CNC Drilling Machine (OP10-1)` and click **Save**.
5. **Reorder Steps**: If you need to rearrange steps, click the **Up/Down arrows** on the right of any row to resequence the steps instantly.

---

## 4. Performing Risk Analysis (PFMEA)

Now, link process steps to their potential failures and evaluate risks.
1. Select the **Process FMEA** tab in the sidebar.
2. Click **Add Analysis Row**.
3. Select your process step (e.g., `Step 10 - Drill core hole`) from the dropdown and click **Submit**. A new, empty FMEA row will render in the grid.

### Step 1: Evaluate Severity, Occurrence, and Detection (S, O, D)
1. Click the **Severity (S)** cell dropdown and select a rating (e.g., `8` - representing a major product defect).
2. Click the **Occurrence (O)** cell dropdown and select a rating (e.g., `4` - moderate failure rate).
3. Click the **Detection (D)** cell dropdown and select a rating (e.g., `5` - moderate detection likelihood).
4. **Action Priority (AP)**: The system will automatically calculate the AP rating based on the **AIAG-VDA lookup tables**. An **AP Badge** (e.g., **High (H)** or **Medium (M)**) will immediately display in the row.

---

## 5. Using the AI Copilot (RAG Suggestions)

If you are unsure of the potential failure modes, causes, or controls for a process step, you can use the built-in AI Copilot.
1. Click the **Edit (pencil)** icon on your PFMEA row to open the side sheet editor.
2. Locate the **AI Copilot Suggestions** card.
3. Click **Propose via AI**. The AI will fetch industry-standard drilling failure data.
4. Once loaded, click **Save Changes** to populate your PFMEA row with AI-generated tags:
   *   **Process Functions**: e.g., `Drill core hole to spec ø12.0mm`.
   *   **Requirements**: e.g., `Hole diameter within +0.05/-0.01mm`.
   *   **Failure Modes**: e.g., `Hole oversized / drill bit runout`.
   *   **Effects**: e.g., `Loose fit in final assembly / rattling`.
   *   **Causes**: e.g., `Spindle bearing wear`.
   *   **Controls**: e.g., `Daily spindle runout check`.
   *   **Characteristics**: e.g., `Critical Characteristic (CC)`.

---

## 6. Closing the Loop: The Control Plan
1. Select the **Control Plan** tab in the sidebar.
2. Notice that the process steps and controls you defined in the PFD and PFMEA have automatically synchronized into the Control Plan.
3. You can now define **Reaction Plans** (what to do if a control fails, e.g., `Quarantine last 5 parts and replace drill bit`) directly in the Control Plan sheet.
