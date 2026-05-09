# Frontend Component Hierarchy

```text
App
├─ AuthProvider
├─ Routes
│  ├─ LoginPage
│  ├─ RegisterPage
│  └─ ProtectedRoute
│     └─ AppShell
│        ├─ EquipmentPage
│        ├─ MyRequestsPage
│        ├─ ApprovalsPage (staff/admin)
│        └─ ManageEquipmentPage (admin)
└─ Shared Components
   ├─ StatusBadge
   └─ ProtectedRoute
```

## Shared Context and Utilities

- `AuthContext`: token/user state + login/register/logout methods
- `api/client.js`: Axios instance with JWT interceptor
