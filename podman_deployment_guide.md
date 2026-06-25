# Podman Deployment & Testing Guide

This guide walks you through deploying the APEX FMEA platform services using **Podman** on Windows, setting up the local database schema, running the backend and frontend dev environments, and verifying that the FMEA workspace features function correctly.

---

## 1. Prerequisites
- **Podman Desktop** or **Podman CLI** (v4.0+) installed and running on your system.
- **Node.js** (v20 LTS recommended) and **npm** installed.
- Ensure that port **5432** (PostgreSQL) and **6379** (Redis) are not being used by any local Windows services.

---

## 2. Deploying Infrastructure via Podman

Podman uses standard Kubernetes-style YAML definitions. We have configured the infrastructure to run inside a single Pod (`fmea-pod`) to simplify networking and port exposures.

### Step A: Start the Podman Pod
From the project root directory, run the npm helper script:
```bash
npm run podman:up
```
*(Alternatively, run the native podman command: `podman play kube fmea-pod.yaml`)*

This command will:
1. Create a Pod named `fmea-pod`.
2. Automatically create two local volumes (`postgres-data-pvc` and `redis-data-pvc`) to persist data.
3. Fetch and spin up the PostgreSQL database (`pgvector/pgvector:pg15`) and Redis cache (`redis:7-alpine`) containers.
4. Bind host ports `5432` and `6379` directly to the pod.

### Step B: Verify the Pod is Running
Run the following command to check that the containers are active:
```bash
podman pod ps
```
Or check individual container statuses:
```bash
podman ps
```

---

## 3. Database Initialization & Seeding

Once the Podman containers are running, you must synchronize the Prisma database schema and seed the initial roles, permissions, and default administrator account.

### Step A: Install Dependencies
Install all package dependencies for the backend and frontend:
```bash
npm run install:all
```

### Step B: Sync Prisma Database Schema
Push the schema to the PostgreSQL container:
```bash
cd backend
npx prisma db push
```

### Step C: Seed Default Tenant & Roles
Seed the database with roles, permissions, and a default user (`admin@fmea.com` / `Password123`):
```bash
npx prisma db seed
```
*(Note: Seeding scripts are configured in backend's `package.json` and run automatically with `prisma db seed`)*

---

## 4. Running the Applications

Open two separate terminal windows to run the backend and frontend dev servers.

### Step A: Launch NestJS Backend
In terminal 1:
```bash
cd backend
npm.cmd run start:dev
```
The backend REST API will boot up on `http://localhost:3000`.

### Step B: Launch React Frontend
In terminal 2:
```bash
cd frontend
npm.cmd run dev
```
The frontend SPA dev server will start. Open `http://localhost:5173` in your browser.

---

## 5. Verifying the Application Workflows

Log in and walk through the following features to verify that the platform runs correctly:

### 1. Authentication
- Go to `http://localhost:5173/login`.
- Log in with the seeded credentials:
  - **Email**: `admin@fmea.com`
  - **Password**: `Password123`
- Verify you are redirected to the **Projects** list.

### 2. Project & Document Context Initialization
- Click **Create Project**, fill out the details, and submit.
- The backend transaction automatically generates three interlinked documents:
  - **Process Flow Diagram (PFD)**
  - **Process FMEA (PFMEA)**
  - **Control Plan**
- Open your new project from the list.

### 3. Step 2: Process Flow Diagram (PFD)
- Navigate to the **Process Flow (PFD)** tab in the sidebar.
- Click **Add Step** and enter details (e.g. `Step 10`, Name: `Drill core hole`, Type: `Operation`).
- Expand the step row and click **Add Work Element** (e.g. `CNC Drilling Machine`, Operator).
- Click **Add Step** again to add a second step (e.g. `Step 20`, Name: `Inspect hole diameter`, Type: `Inspection`).
- Use the **Up/Down arrows** to swap step sequences and verify they re-render correctly.

### 4. Steps 3–5: Process FMEA Grid (PFMEA)
- Navigate to the **Process FMEA** tab in the sidebar.
- Click **Add Analysis Row**. Select `Step 10 - Drill core hole` from the dropdown and submit.
- A new row appears in the grid.
- Click the **Severity (S)** dropdown in the cell and select `8`.
- Click the **Occurrence (O)** dropdown and select `4`.
- Click the **Detection (D)** dropdown and select `5`.
- Verify the **AP (Action Priority)** badge immediately updates to **Medium (M)** on the client grid.
- Click the **Edit** (pencil) icon on the row to open the side sheet drawer.

### 5. AI Copilot RAG Suggestions
- Inside the side sheet drawer, locate the **AI Copilot Suggestions** card.
- Click **Propose via AI**.
- A loading indicator will retrieve recommended failure chains.
- Once finished, verify the text fields (Functions, Requirements, Failure Modes, Effects, Causes, Controls, and Characteristics) are pre-filled with industry-standard drilling failure data.
- Click **Save Changes** and verify the grid is populated with the new tags.

---

## 6. Teardown
To stop the services and release ports, run:
```bash
npm run podman:down
```
This stops the pod and releases all associated container resources while preserving database state inside the Podman volumes.
