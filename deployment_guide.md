# APEX FMEA Platform — Cloudflare & Render Deployment Guide

This guide walks you through deploying the multi-tenant AI-assisted FMEA platform to production using the **Cloudflare Free Plan** (for frontend static hosting, DNS, and proxy) paired with **Render** (for backend Node.js containers) and **Neon** (for serverless PostgreSQL database).

---

## 1. Production Architecture Overview

Because we are deploying under the **Cloudflare Free Plan**:
*   **Frontend**: Deployed to **Cloudflare Pages** (100% Free, high-performance Edge hosting, unlimited bandwidth).
*   **Backend API**: Deployed to **Render** (Free tier Web Service) as a Docker container. This bypasses Cloudflare Workers' 10ms CPU limit and handles NestJS/Prisma reflections seamlessly.
*   **Database**: Deployed to **Neon Postgres** (Free tier Serverless PostgreSQL).
*   **Routing & Security**: Cloudflare DNS manages your domain, provides WAF protection, and proxies HTTP traffic to the backend.

```mermaid
graph TD
    Client[Browser / User] -->|HTTPS| Pages[Cloudflare Pages<br/>React Frontend]
    Client -->|HTTPS / API| CFProxy[Cloudflare DNS Proxy<br/>SSL & Security]
    CFProxy -->|Proxy Pass| NodeCompute[Render Web Service<br/>NestJS Docker Container]
    NodeCompute -->|PostgreSQL Protocol| Neon[Neon Serverless Postgres]
```

---

## 2. Step-by-Step Deployment

### Step A: Set up the Neon PostgreSQL Database
1.  Sign up at [Neon.tech](https://neon.tech/) and create a new project.
2.  Choose PostgreSQL version **15+** and name your database.
3.  Copy the connection string from the Neon Dashboard. It will look like this:
    ```text
    postgresql://neondb_owner:npg_VndmZP2yzX4L@ep-lingering-block-aipth776.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
    ```
4.  From your local machine, run database migrations and seed default values:
    ```bash
    cd backend
    
    # 1. Set the database connection URL in your environment (with a 30s timeout to allow Neon to wake up)
    $env:DATABASE_URL="postgresql://neondb_owner:npg_VndmZP2yzX4L@ep-lingering-block-aipth776.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30"
    
    # 2. Push the Prisma schema to Neon
    npx.cmd prisma db push
    
    # 3. Seed default roles/users
    npx.cmd prisma db seed
    ```

### Step B: Push the Project to GitHub
Ensure all recent deployment fixes (updated Dockerfile, Cloudflare Pages configs) are pushed to your GitHub repository:
```bash
git add .
git commit -m "chore: setup deployment configs for render and cloudflare pages"
git push -u origin main
```
*Note: Since the cached credentials were reset, log in when prompted with the account possessing write permissions for `lenvthank-source/fmea`.*

### Step C: Deploy Backend on Render
1.  Log in to [Render.com](https://render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Set the following configuration details:
    *   **Name**: `fmea-backend-api`
    *   **Root Directory**: `backend`
    *   **Runtime**: `Docker` (Render automatically builds the backend using `backend/Dockerfile`)
    *   **Instance Type**: `Free`
5.  Under **Advanced -> Environment Variables**, add the following settings:
    *   `DATABASE_URL` = `<Your Neon Connection String>` (Make sure to append `&connect_timeout=30` to avoid cold-start timeouts)
    *   `JWT_SECRET` = `<Generate a secure random string>`
    *   `JWT_REFRESH_SECRET` = `<Generate a secure random string>`
    *   `PORT` = `3000`
6.  Click **Deploy Web Service**.
7.  Once the deployment is complete, note down your backend service URL (e.g., `https://fmea-backend-api.onrender.com`).

### Step D: Deploy Frontend to Cloudflare Pages
1.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  Go to **Workers & Pages** -> **Pages** -> **Connect to Git**.
3.  Select your repository and branch (`main`).
4.  Configure the build settings:
    *   **Project Name**: `fmea-frontend`
    *   **Framework preset**: `Vite`
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
    *   **Root directory**: `frontend`
5.  In the **Environment variables** section, add the environment variable pointing the React app to your newly deployed backend:
    *   `VITE_API_BASE_URL` = `https://fmea-backend-api.onrender.com/api/v1` (replace with your actual Render URL)
6.  Click **Save and Deploy**.

Cloudflare will compile the frontend assets, set up the SPA redirect fallback rules, and deploy the application globally. You can now access your app at `https://fmea-frontend.pages.dev`!
