import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { MyRequestsPage } from "./pages/MyRequestsPage";
import { ManageEquipmentPage } from "./pages/ManageEquipmentPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="page-center">
        <div className="loader" />
        <p>Loading portal...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/equipment" : "/login"} replace />}
      />

      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/equipment" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/equipment" replace /> : <RegisterPage />}
      />

      <Route
        path="/equipment"
        element={
          <ProtectedRoute>
            <AppShell>
              <EquipmentPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-requests"
        element={
          <ProtectedRoute>
            <AppShell>
              <MyRequestsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/approvals"
        element={
          <ProtectedRoute roles={["staff", "admin"]}>
            <AppShell>
              <ApprovalsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-equipment"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AppShell>
              <ManageEquipmentPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
