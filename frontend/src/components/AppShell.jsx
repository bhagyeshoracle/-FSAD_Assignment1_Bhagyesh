import { NavLink } from "react-router-dom";
import { LogOut, Boxes, ClipboardList, ShieldCheck, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const roleLabel = {
  admin: "Administrator",
  staff: "Staff",
  student: "Student",
};

export function AppShell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">
          <h1>School Equipment Lending Portal</h1>
          <p>Track borrow requests, approvals, and returns in one place.</p>
        </div>

        <div className="user-zone">
          <div>
            <strong>{user?.name}</strong>
            <p>{roleLabel[user?.role] || user?.role}</p>
          </div>
          <button type="button" className="icon-btn" onClick={logout} title="Logout">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <nav className="main-nav">
        <NavLink to="/equipment" className="nav-link">
          <Boxes size={16} />
          Equipment
        </NavLink>
        <NavLink to="/my-requests" className="nav-link">
          <ClipboardList size={16} />
          My Requests
        </NavLink>
        {(user?.role === "staff" || user?.role === "admin") && (
          <NavLink to="/approvals" className="nav-link">
            <ShieldCheck size={16} />
            Approvals
          </NavLink>
        )}
        {user?.role === "admin" && (
          <NavLink to="/manage-equipment" className="nav-link">
            <Settings size={16} />
            Manage Equipment
          </NavLink>
        )}
      </nav>

      <main className="content">{children}</main>
    </div>
  );
}
