import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, Shield, Upload, Video, X } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export function AppShell() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <h1>StreamGuard</h1>
        <p className="muted">Moderation Console</p>
        <nav>
          <NavLink to="/dashboard" end onClick={closeSidebar}>
            <LayoutDashboard size={16} />
            Overview
          </NavLink>
          <NavLink to="/dashboard/upload" onClick={closeSidebar}>
            <Upload size={16} />
            Upload
          </NavLink>
          <NavLink to="/dashboard/videos" onClick={closeSidebar}>
            <Video size={16} />
            Videos
          </NavLink>
          {user?.role === "ADMIN" ? (
            <NavLink to="/dashboard/users" onClick={closeSidebar}>
              <Shield size={16} />
              Users
            </NavLink>
          ) : null}
        </nav>

        <div className="sidebar-footer">
          <p>{user?.email ?? "Logged in user"}</p>
          <div className="sidebar-footer-actions">
            <span className="sidebar-meta-button">{user?.role ?? "VIEWER"}</span>
            <button
              type="button"
              className="sidebar-logout-button"
              onClick={() => {
                closeSidebar();
                logout();
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen ? <button type="button" className="sidebar-overlay" onClick={closeSidebar} aria-label="Close menu" /> : null}

      <main className="content">
        <div className="mobile-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <p>Menu</p>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
