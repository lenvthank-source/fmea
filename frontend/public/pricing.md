# Pricing — FMEApex AI Quality Risk Platform

FMEApex provides transparent pricing tiers for Quality Engineering teams, Plant Managers, and Enterprise Manufacturers.

## Guest / Sandbox Tier
- **Price**: $0 (No credit card required)
- **Duration**: 15 days active trial access
- **Workspace**: `guest-tenant` isolated workspace
- **Features Included**:
  - Full AIAG-VDA 7-Step FMEA Workspaces (PFMEA & DFMEA)
  - PFD to PFMEA Bidirectional Linking & Gap Analysis
  - Control Plan Synchronization
  - AI Copilot Suggestions
  - Action Priority (AP) Auto-Calculation
  - Maximum 5 active projects

## Professional Quality Engineer Tier
- **Price**: $49 / user / month (Billed annually) or $59 / user / month (Billed monthly)
- **Target**: Quality Engineers, Process Engineers, Supplier Quality Managers
- **Features Included**:
  - Unlimited PFMEA, DFMEA, PFD, and Control Plan documents
  - Full AI Copilot suggestion generator (LLM + RAG Vector Search)
  - Corrective action lifecycle tracking with Cloudflare R2 evidence file uploads (up to 50MB per file)
  - PDF & Excel export generation
  - Role-Based Access Control (Quality Engineer, Reviewer, Viewer roles)
  - Standard email & community support

## Enterprise Manufacturing Tier
- **Price**: Custom annual contract (Contact sales@fmeapex.online)
- **Target**: Multi-plant manufacturing enterprises, Automotive OEMs, Tier-1 Suppliers, Medical Device Manufacturers
- **Features Included**:
  - Dedicated multi-tenant database isolation with Postgres Row-Level Security (RLS)
  - Single Sign-On (SSO / SAML 2.0 / OIDC) integration (`admin.config`)
  - 21 CFR Part 11 Audit Trail with immutable locked revisions & digital signatures
  - Admin & Approver roles (`revision.approve`, `admin.config`)
  - PLM, ERP, & MES outbound HMAC-SHA256 signed webhooks (`X-FMEA-Signature`)
  - SLA guarantee & dedicated quality account manager
