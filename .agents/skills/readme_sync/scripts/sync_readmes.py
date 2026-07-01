import os
import re

# Directory targets to document
TARGET_DIRS = [
    "backend/prisma",
    "backend/src",
    "backend/test",
    "frontend/src"
]

# File description catalog
FILE_CATALOG = {
    # backend/prisma
    "schema.prisma": "The database schema definition containing all Prisma models for the multi-tenant FMEA platform (Tenant, User, Role, Permission, Project, Document, ProcessStep, PfmeaRow, Action, etc.).",
    
    # backend/src
    "main.ts": "Entry point of the NestJS application. Starts the server, sets up global prefix, validation pipe, and CORS.",
    "app.module.ts": "Root module of the application. Registers all modules, configuration, database service, and global guards.",
    "app.controller.ts": "Root application controller containing basic healthcheck or welcome route.",
    "app.service.ts": "Root application service providing basic status or greeting text.",
    "app.controller.spec.ts": "Unit test suite for AppController.",
    
    # backend/src/prisma
    "prisma.service.ts": "NestJS service initializing the Prisma database client and managing connections.",
    "prisma.module.ts": "NestJS module exposing the PrismaService globally.",
    
    # backend/src/modules/action
    "action.controller.ts": "Controller defining API endpoints for actions and evidence uploads (CRUD, evidence attachment).",
    "action.service.ts": "Core service logic for actions management, evidence storage in R2, and status updates.",
    "action.module.ts": "NestJS module registering action routes, services, and cloud storage providers.",
    "r2.service.ts": "Service managing evidence file uploads and presigned URLs using Cloudflare R2 bucket.",
    
    # backend/src/modules/action/dto
    "create-action.dto.ts": "Data Transfer Object defining payload for creating actions (due date, owner, priority).",
    "update-action.dto.ts": "Data Transfer Object defining payload for updating action details.",
    
    # backend/src/modules/auth
    "auth.controller.ts": "Controller defining API endpoints for user authentication (login, signup, session).",
    "auth.service.ts": "Service managing password hashing, user registration, JWT generation, and tenant lookup.",
    "auth.module.ts": "NestJS module configuring authentication, passport strategies, and JWT parameters.",
    "jwt-auth.guard.ts": "Global or route-specific guard for validating JWT tokens.",
    "jwt.strategy.ts": "Passport strategy for decoding and verifying JWT tokens.",
    
    # backend/src/modules/auth/decorators
    "permissions.decorator.ts": "Custom decorator to specify required permissions for controllers or handlers.",
    "public.decorator.ts": "Custom decorator to bypass authentication for public endpoints.",
    
    # backend/src/modules/auth/dto
    "login.dto.ts": "Payload schema for login request.",
    "signup.dto.ts": "Payload schema for signup request.",
    
    # backend/src/modules/auth/guards
    "permission.guard.ts": "Guard enforcing role-based permission checks on endpoints.",
    
    # backend/src/modules/auth/interfaces
    "jwt-payload.interface.ts": "Interface defining structure of decoded JWT payload.",
    "request-with-user.interface.ts": "Extension of Express request interface containing authenticated user context.",
    
    # backend/src/modules/control-plan
    "control-plan-row.controller.ts": "Controller managing API endpoints for Control Plan rows.",
    "control-plan-row.service.ts": "Service logic managing control plan characteristics, methods, and reaction plans.",
    "control-plan.module.ts": "NestJS module registering control plan controller and service.",
    
    # backend/src/modules/control-plan/dto
    "create-cp-row.dto.ts": "Data Transfer Object (DTO) for creating control plan rows.",
    "update-cp-row.dto.ts": "Data Transfer Object (DTO) for updating control plan rows.",
    
    # backend/src/modules/pfd
    "pfd.controller.ts": "Controller managing API endpoints for Process Flow Diagram steps.",
    "pfd.service.ts": "Service managing process flow step creations, re-ordering, and PFMEA linkages.",
    "pfd.module.ts": "NestJS module registering PFD components.",
    
    # backend/src/modules/pfd/dto
    "create-step.dto.ts": "Data Transfer Object (DTO) for creating process steps in the PFD.",
    "update-step.dto.ts": "Data Transfer Object (DTO) for updating process steps in the PFD.",
    
    # backend/src/modules/pfmea
    "pfmea-row.controller.ts": "Controller defining API endpoints for PFMEA rows.",
    "pfmea-row.service.ts": "Core service logic managing PFMEA functions, requirements, failure modes, effects, causes, and action priority calculations.",
    "pfmea.module.ts": "NestJS module registering PFMEA controllers, services, and AP utilities.",
    "ap-calculator.ts": "Utility file implementing logic to compute AIAG-VDA 2019 Action Priority (AP) based on Severity, Occurrence, and Detection.",
    "ap-calculator.spec.ts": "Unit tests for the Action Priority calculator.",
    
    # backend/src/modules/pfmea/dto
    "create-pfmea-row.dto.ts": "Data Transfer Object (DTO) for creating new PFMEA rows.",
    "update-pfmea-row.dto.ts": "Data Transfer Object (DTO) for updating PFMEA row values, scores, and status.",
    
    # backend/src/modules/project
    "project.controller.ts": "Controller defining endpoints for FMEA projects.",
    "project.service.ts": "Service implementing project CRUD operations, team leads, and quality header metadata.",
    "project.module.ts": "NestJS module registering project components.",
    
    # backend/src/modules/project/dto
    "create-project.dto.ts": "Data Transfer Object (DTO) containing parameters to initialize a project (name, customer, CFT members).",
    "update-project.dto.ts": "Data Transfer Object (DTO) containing parameters to update project headers and metadata.",
    
    # backend/test
    "app.e2e-spec.ts": "End-to-end integration test suite for backend HTTP requests.",
    "jest-e2e.json": "Jest configuration for end-to-end testing.",
    
    # frontend/src
    "main.tsx": "Entry point for React rendering. Sets up standard provider wrappers.",
    "App.tsx": "Main application component configuring RouterProvider and ThemeProvider.",
    "App.css": "Global CSS styles.",
    "index.css": "Basic CSS stylesheet for global overrides.",
    "config.ts": "Configuration settings including Backend API base URL.",
    
    # frontend/src/app
    "router.tsx": "App routing configuration declaring paths and components (auth layout, dashboard layout, workspaces).",
    
    # frontend/src/assets
    "hero.png": "Illustration/image used for login/landing pages.",
    "react.svg": "SVG logo for React.",
    "vite.svg": "SVG logo for Vite.",
    
    # frontend/src/components
    "DocumentHeader.tsx": "Shared quality header component displaying details like Document Number, Revision, drawing date, and CFT members.",
    
    # frontend/src/components/Layout
    "AppShell.tsx": "Navigation bar, side drawer, tenant layout, and user menu container.",
    
    # frontend/src/features/actions
    "ActionsDashboard.tsx": "Dashboard view for viewing, filtering, creating, and attaching evidence to action priority tasks.",
    
    # frontend/src/features/auth
    "AuthContext.tsx": "Context provider managing login, token storage, user permissions, and active tenant.",
    "Login.tsx": "Login screen with email/password authentication.",
    
    # frontend/src/features/control-plan
    "ControlPlanWorkspace.tsx": "Workspace component displaying the Control Plan grid with special characteristics, method of controls, and reaction plans.",
    
    # frontend/src/features/dfmea
    "DfmeaWorkspace.tsx": "Workspace component for Design FMEA grids.",
    
    # frontend/src/features/dfmea/components
    "DfmeaStructureTree.tsx": "Visual structure tree of DFMEA functions and elements.",
    
    # frontend/src/features/linkage
    "LinkageMap.tsx": "Interactive component displaying linkages between PFD, PFMEA, and Control Plan.",
    
    # frontend/src/features/pfd
    "PfdWorkspace.tsx": "Workspace containing interactive flowcharts of process steps and operations.",
    
    # frontend/src/features/pfd/components
    "StepFormDialog.tsx": "Dialog to add/edit process steps.",
    "WorkElementDialog.tsx": "Dialog to add/edit 4M/work elements for steps.",
    
    # frontend/src/features/pfmea
    "PfmeaWorkspace.tsx": "Main PFMEA grid implementing the AIAG-VDA 7-Step process grid interface.",
    
    # frontend/src/features/pfmea/components
    "PfmeaRowEditor.tsx": "Slide-over/modal editor to edit detailed FMEA row contents (Severity, Occurrence, Detection, and AP).",
    "PfmeaStructureTree.tsx": "Sidebar tree representing process steps, functions, and failures.",
    
    # frontend/src/features/pfmea/utils
    "apCalculator.ts": "Port of Action Priority calculation logic to the frontend.",
    
    # frontend/src/features/projects
    "ProjectList.tsx": "Grid showing list of active and archived projects.",
    "ProjectSettings.tsx": "Settings page to configure team leads, CFT members, and drawing metadata.",
    
    # frontend/src/features/reports
    "ReportExporter.tsx": "Component providing export buttons to download Excel, PDF, or JSON reports of FMEA data.",
    
    # frontend/src/hooks
    "useResponsive.ts": "Custom hook to detect window size and responsive breakpoints.",
    
    # frontend/src/theme
    "theme.ts": "Custom Material-UI theme configurations, fonts, and dark mode tokens."
}

def extract_file_description(file_path):
    """Attempts to read file comments to determine purpose if not in catalog."""
    filename = os.path.basename(file_path)
    if filename in FILE_CATALOG:
        return FILE_CATALOG[filename]
    
    # Fallback to scanning file content
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read(1000) # read first 1000 chars
            # Check for JS/TS multiline comments
            comment_match = re.search(r"/\*\*([\s\S]*?)\*/", content)
            if comment_match:
                comment = comment_match.group(1).strip()
                # Clean comment symbols
                lines = [line.strip().lstrip("*").strip() for line in comment.split("\n")]
                cleaned = " ".join([l for l in lines if l])
                if cleaned:
                    return cleaned
    except Exception:
        pass
    
    return f"Source code component implementing {os.path.splitext(filename)[0]} functionality."

def generate_readme(dir_path):
    # Relative path from root
    rel_path = os.path.relpath(dir_path, ".").replace("\\", "/")
    dir_name = os.path.basename(dir_path)
    
    # Scan directory contents
    items = os.listdir(dir_path)
    files = []
    subdirs = []
    
    for item in items:
        full_path = os.path.join(dir_path, item)
        if item == "README.md":
            continue
        if os.path.isdir(full_path):
            if item not in ["node_modules", "dist", "build", ".git", ".agents", "uploads"]:
                subdirs.append(item)
        elif os.path.isfile(full_path):
            if not item.startswith("."): # ignore hidden files
                files.append(item)
    
    # If there are no files and no subdirectories we care about, skip
    if not files and not subdirs:
        return
        
    # Title formatting
    title = rel_path.upper() if "/" in rel_path else rel_path.capitalize()
    
    content = []
    content.append(f"# {title} Directory")
    content.append("")
    content.append(f"Purpose: Module folder managing {dir_name} logic and assets.")
    content.append("")
    content.append("## Directory Metadata")
    content.append(f"- **Path**: `{rel_path}`")
    content.append(f"- **Files Count**: {len(files)}")
    content.append(f"- **Subdirectories Count**: {len(subdirs)}")
    content.append("")
    
    if files:
        content.append("## File Map")
        content.append("")
        content.append("| File | Purpose / Responsibility |")
        content.append("| :--- | :--- |")
        for file in sorted(files):
            desc = extract_file_description(os.path.join(dir_path, file))
            content.append(f"| [`{file}`](./{file}) | {desc} |")
        content.append("")
        
    if subdirs:
        content.append("## Subdirectories")
        content.append("")
        for subdir in sorted(subdirs):
            content.append(f"- [{subdir}](./{subdir}/README.md) - Subdirectory folder containing localized modules.")
        content.append("")
        
    readme_path = os.path.join(dir_path, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("\n".join(content))
    print(f"Generated: {readme_path}")

def main():
    print("Starting README synchronization...")
    # Generate for targeted roots
    for target in TARGET_DIRS:
        if os.path.exists(target):
            # Run walk recursively
            for root, dirs, files in os.walk(target):
                generate_readme(root)
    print("README synchronization completed successfully.")

if __name__ == "__main__":
    main()
