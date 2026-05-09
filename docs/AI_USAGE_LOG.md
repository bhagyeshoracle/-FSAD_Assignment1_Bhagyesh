# AI Usage Log (Option A: Build from Scratch with AI Assistance)

## Tooling Used

- Codex (GPT-based coding assistant)
- AI used for:
  - architecture design
  - code generation
  - bug fixing and build validation
  - API documentation draft
  - reflection structuring

## Prompt and Action Log

1. Prompt: "Help me create and complete code for my college assignment..."
   - Action: Project scaffolded into microservices + React architecture.

2. Prompt intent: "Need modern React frontend and microservice backend with DB."
   - Action: Implemented Auth, Inventory, Lending, API Gateway services with SQLite persistence.

3. Prompt intent: "Need role-based workflows."
   - Action: Added JWT auth, protected routes, and role controls in both backend and frontend.

4. Prompt intent: "Prevent overlapping bookings."
   - Action: Added overlap query logic in lending service before creating requests.

5. Prompt intent: "Need complete deliverables."
   - Action: Added architecture doc, API docs, AI reflection report, and demo script.

## AI-Generated vs Manual Work Split

- AI-generated (majority):
  - service and frontend boilerplate
  - routing and CRUD APIs
  - UI component scaffolding
  - initial docs and markdown structure

- Manually validated/adjusted by student:
  - feature scope selection
  - endpoint naming and role policy confirmation
  - final wording and assignment alignment
  - demo scenario planning

## Debugging/Correction Notes

1. Environment issue: `npm` PowerShell execution policy was blocked.
   - Fix: used `npm.cmd`.

2. Tooling mismatch risk: React Router v7 API differences.
   - Fix: pinned to `react-router-dom@6.30.1`.

3. Build safety:
   - Fix: service and frontend run/build verification commands added.
