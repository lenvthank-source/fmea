# FMEA Platform Frontend

This is the frontend single page application (SPA) for the AI-Powered FMEA Platform, built using **React 18**, **TypeScript**, **Vite**, and **Material-UI (MUI)**.

---

## 🗺️ Frontend Directory Structure

For ease of navigation and context optimization, each subdirectory contains its own `README.md` index file:

- 📂 **[`public/`](./public/README.md)**: Static assets (logos, manifest files).
- 📂 **[`src/`](./src/README.md)**: React source code folder.
  - 📂 **[`src/app/`](./src/app/README.md)**: Application router and global navigation config.
  - 📂 **[`src/assets/`](./src/assets/README.md)**: Local images, vector icons, and styling assets.
  - 📂 **[`src/components/`](./src/components/README.md)**: Shared visual components (e.g. `DocumentHeader`, Layouts).
  - 📂 **[`src/features/`](./src/features/README.md)**: Core features (Auth, Projects, PFD, PFMEA, Control Plans, Actions, Reports).
  - 📂 **[`src/hooks/`](./src/hooks/README.md)**: Custom React hooks (responsive utilities, fetch hooks).
  - 📂 **[`src/theme/`](./src/theme/README.md)**: Color definitions, spacing, and styling tokens.

---

## 🛠️ Project Setup & Commands

### Prerequisites
- Node.js (v18+)

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Code Linting
```bash
npx oxlint
```
