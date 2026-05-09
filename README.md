# Campus Equipment Lending Portal

Full-stack assignment project built with:

- Frontend: React + Vite
- Backend: Node.js microservices (Express)
- Database: SQLite (persistent local file)
- Architecture: Auth Service + Inventory Service + Lending Service + API Gateway

## Problem Statement

Schools and colleges lend shared resources (lab kits, sports gear, media equipment). Manual tracking often causes missing records and booking conflicts.  
This portal digitizes request, approval, issue, and return workflows with role-based access.

## Core Features Implemented

1. User authentication and role-based access (`student`, `staff`, `admin`)
2. Equipment CRUD for admins
3. Borrow request workflow:
   - submit request
   - approve/reject by staff/admin
   - mark as returned
4. Overlapping booking conflict validation
5. Dashboard with search/filter
6. Responsive UI with role-based navigation
7. API Gateway routing for all frontend traffic

## Project Structure

```text
FSAD ASsignment/
  backend/
    services/
      auth-service/
      inventory-service/
      lending-service/
      api-gateway/
    shared/
    docs/
  frontend/
  docs/
```

## Quick Start

1. Install dependencies:

```powershell
npm.cmd install
cd frontend; npm.cmd install; cd ..
cd backend/services/auth-service; npm.cmd install; cd ../../..
cd backend/services/inventory-service; npm.cmd install; cd ../../..
cd backend/services/lending-service; npm.cmd install; cd ../../..
cd backend/services/api-gateway; npm.cmd install; cd ../../..
```

2. Run all services + frontend:

```powershell
npm.cmd run dev
```

3. Open frontend:

- [http://localhost:5173](http://localhost:5173)

## Default Demo Accounts

- Admin: `admin@school.edu` / `password123`
- Staff: `staff@school.edu` / `password123`
- Student: `student@school.edu` / `password123`

## Ports

- API Gateway: `4000`
- Auth Service: `4001`
- Inventory Service: `4002`
- Lending Service: `4003`
- Frontend: `5173`

## Database

- SQLite file path: `backend/data/equipment_portal.db`
- Auto-created on first run
- Seeded with demo users and sample equipment

## Submission Documents

- Architecture + DB schema: `backend/docs/ARCHITECTURE_AND_DB.md`
- API documentation: `backend/docs/API_DOCUMENTATION.md`
- AI usage log: `docs/AI_USAGE_LOG.md`
- Reflection report: `docs/AI_REFLECTION_REPORT.md`
- Demo video guide: `docs/DEMO_SCRIPT.md`
- Component hierarchy: `docs/COMPONENT_HIERARCHY.md`
- Assumptions: `docs/ASSUMPTIONS.md`
