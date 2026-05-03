import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/client";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.email || "").charAt(0).toUpperCase();

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "light";
    } catch (e) {
      return "light";
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    // Fetch unread notification count
    const fetchUnreadCount = async () => {
      try {
        const response = await apiClient.get("/workflow/notifications/unread-count");
        setUnreadCount(response.data.unreadCount || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    if (user) {
      fetchUnreadCount();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-dot" />
            <div>
              <h1>StageFlow</h1>
              <p>Gestion stagiaires</p>
            </div>
          </div>

          <div className="sidebar-user">
            <div className="avatar" aria-hidden>
              {initials}
            </div>
            <div className="user-meta">
              <div className="user-email">{user?.email || "Invité"}</div>
              <div className="role-badge">{user?.role || "guest"}</div>
            </div>
          </div>
        </div>

        <nav className="nav-links" role="navigation">
          <div className="nav-group">
            <div className="nav-group-title">Principal</div>
            <NavLink to="/app/dashboard">📊 Dashboard</NavLink>
            <NavLink to="/app/enhanced-dashboard">📈 Stats Avancées</NavLink>
          </div>

          <div className="nav-group">
            <div className="nav-group-title">🔐 Administration</div>
            {user?.role === "admin" && <NavLink to="/app/admin/rh-companies">👥 RH & Companies</NavLink>}
            {user?.role === "admin" && <NavLink to="/app/admin/students">🎓 Students</NavLink>}
            {user?.role === "admin" && <NavLink to="/app/admin/applications">📝 Applications</NavLink>}
            {user?.role === "admin" && <NavLink to="/app/admin/supervisors">👨‍💼 Supervisors</NavLink>}
          </div>

          <div className="nav-group">
            <div className="nav-group-title">👨‍🏫 Superviseur</div>
            {user?.role === "supervisor" && <NavLink to="/app/supervisor/internships">📋 Mes stages</NavLink>}
          </div>

          <div className="nav-group">
            <div className="nav-group-title">🎯 Stagiaire</div>
            {user?.role === "student" && <NavLink to="/app/student/my-project">🏢 Mon Projet</NavLink>}
            {user?.role === "student" && <NavLink to="/app/student/acceptance">✨ Mes propositions</NavLink>}
            {user?.role === "student" && <NavLink to="/app/student/weekly-followup">📅 Suivi hebdomadaire</NavLink>}
            {user?.role === "student" && <NavLink to="/app/student/profile">⚙️ Mon profil</NavLink>}
          </div>

          <div className="nav-group">
            <div className="nav-group-title">🏢 Entreprise</div>
            {user?.role !== "company" && <NavLink to="/app/internships">📌 Stages</NavLink>}
            {user?.role === "company" && <NavLink to="/app/company/profile">🏪 Profil</NavLink>}
            {user?.role === "company" && <NavLink to="/app/company/internships">📋 Stages</NavLink>}
            {user?.role === "company" && <NavLink to="/app/company/applications">📮 Applications</NavLink>}
            {user?.role === "company" && <NavLink to="/app/company/supervisors">👨‍💼 Supervisors</NavLink>}
            {user?.role === "company" && <NavLink to="/app/company/interns">👨‍🎓 Interns</NavLink>}
          </div>

          <div className="nav-group">
            <div className="nav-group-title">✅ Travail</div>
            <NavLink to="/app/notifications">🔔 Notifications</NavLink>
            {(user?.role === "supervisor" || user?.role === "student") && (
              <div className="nav-link-with-badge">
                <NavLink to="/app/tasks">📝 Tasks</NavLink>
                {unreadCount > 0 && (
                  <span className="notification-badge" title={`${unreadCount} unread notifications`}>
                    🔴 {unreadCount}
                  </span>
                )}
              </div>
            )}
            {(user?.role === "supervisor" || user?.role === "student") && (
              <NavLink to="/app/reports">📊 Reports</NavLink>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          {(user?.role === "supervisor" || user?.role === "student" || user?.role === "company") && (
            <NavLink 
              className="sidebar-footer-link" 
              to={
                user?.role === "supervisor" ? "/app/supervisor/profile" :
                user?.role === "student" ? "/app/student/profile" :
                "/app/company/profile"
              }
            >
              ⚙️ Mon profil
            </NavLink>
          )}
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Se deconnecter
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h2>Bienvenue, {user?.email}</h2>
            <p>Role: {user?.role}</p>
          </div>
          <div className="topbar-actions">
            <button type="button" className="theme-toggle" onClick={toggleTheme} aria-pressed={theme==="dark"}>
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        <section className="page-wrapper">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default Layout;
