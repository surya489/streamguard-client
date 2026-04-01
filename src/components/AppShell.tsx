import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { CircleUserRound, EllipsisVertical, LayoutDashboard, LogOut, Menu, Shield, Upload, Video, X } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/api";
import { getUserInitials } from "../utils/user";

export function AppShell() {
  const { token, user, logout, updateUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setIsUserMenuOpen(false);
  };
  const canUpload = user?.role === "ADMIN" || user?.role === "EDITOR";
  const displayName = user?.name && user.name.trim().length > 0 ? user.name.trim() : user?.email?.split("@")[0] ?? "User";
  const initials = getUserInitials(user?.name ?? "", user?.email ?? "");

  useEffect(() => {
    async function hydrateProfileName() {
      if (!token || !user || user.name) return;
      try {
        const response = await getProfile(token);
        updateUser({ name: response.user.name, email: response.user.email });
      } catch {
        // keep sidebar stable even if profile endpoint fails
      }
    }

    void hydrateProfileName();
  }, [token, updateUser, user]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
          {canUpload ? (
            <NavLink to="/dashboard/upload" onClick={closeSidebar}>
              <Upload size={16} />
              Upload
            </NavLink>
          ) : null}
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

        <div className="sidebar-footer" ref={userMenuRef}>
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-copy">
              <p className="sidebar-user-email">{user?.email ?? "Logged in user"}</p>
              <p className="sidebar-user-role">{(user?.role ?? "VIEWER").toLowerCase()}</p>
              <p className="sidebar-user-name">{displayName}</p>
            </div>
            <button
              type="button"
              className="sidebar-logout-button sidebar-icon-btn"
              title="Open user menu"
              aria-label="Open user menu"
              onClick={() => setIsUserMenuOpen((open) => !open)}
            >
              <EllipsisVertical size={16} />
            </button>
          </div>

          {isUserMenuOpen ? (
            <div className="sidebar-user-menu">
              <Link to="/dashboard/profile" className="sidebar-user-menu-item" onClick={closeSidebar}>
                <CircleUserRound size={15} />
                Account
              </Link>
              <button
                type="button"
                className="sidebar-user-menu-item"
                onClick={() => {
                  closeSidebar();
                  logout();
                }}
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          ) : null}
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
          <p className="mobile-topbar-label">Menu</p>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
