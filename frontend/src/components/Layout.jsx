import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/client";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const initials = (user?.email || "").charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((current) => !current);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await apiClient.get("/workflow/notifications/unread-count");
        setUnreadCount(response.data.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    if (!user) {
      return undefined;
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="app-shell">
      <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle mobile menu">
        Menu
      </button>

      <aside className={`sidebar ${isMobileMenuOpen ? "open" : ""}`} aria-label="Primary navigation">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-dot" />
            <div>
              <h1>StageFlow</h1>
              <p>Internship management</p>
            </div>
          </div>

          <div className="sidebar-user">
            <div className="avatar" aria-hidden>
              {initials}
            </div>
            <div className="user-meta">
              <div className="user-email">{user?.email || "Guest"}</div>
              <div className="role-badge">{user?.role || "guest"}</div>
            </div>
          </div>
        </div>

        <nav className="nav-links" role="navigation">
          <div className="nav-group">
            <div className="nav-group-title">Overview</div>
            <NavLink to="/app/dashboard" onClick={closeMobileMenu}>
              Dashboard
            </NavLink>
            <NavLink to="/app/enhanced-dashboard" onClick={closeMobileMenu}>
              Advanced stats
            </NavLink>
          </div>

          <div className="nav-group">
            <div className="nav-group-title">
              {user?.role === "supervisor" ? "Supervision" : "Internship"}
            </div>
            {user?.role === "student" && (
              <NavLink to="/app/student/my-project" onClick={closeMobileMenu}>
                My project
              </NavLink>
            )}
            {user?.role === "student" && (
              <NavLink to="/app/student/applications" onClick={closeMobileMenu}>
                My applications
              </NavLink>
            )}
            {user?.role === "supervisor" && (
              <NavLink to="/app/supervisor/my-projects" onClick={closeMobileMenu}>
                My projects
              </NavLink>
            )}
            {user?.role === "supervisor" && (
              <NavLink to="/app/supervisor/projects" onClick={closeMobileMenu}>
                Project builder
              </NavLink>
            )}
            {user?.role === "supervisor" && (
              <button
                className="add-intern-btn"
                onClick={() => {
                  closeMobileMenu();
                  navigate("/app/supervisor/add-intern");
                }}
              >
                Add intern
              </button>
            )}
          </div>

          {(user?.role === "student" || user?.role === "supervisor") && (
            <div className="nav-group">
              <div className="nav-group-title">Work</div>
              <div className="nav-link-with-badge">
                <NavLink to="/app/notifications" onClick={closeMobileMenu}>
                  Notifications
                </NavLink>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </div>
              <NavLink to="/app/tasks" onClick={closeMobileMenu}>
                Tasks
              </NavLink>
              <NavLink to="/app/reports" onClick={closeMobileMenu}>
                Reports
              </NavLink>
            </div>
          )}

          {user?.role === "admin" && (
            <div className="nav-group">
              <div className="nav-group-title">Administration</div>
              <NavLink to="/app/admin/rh-companies" onClick={closeMobileMenu}>
                Companies
              </NavLink>
              <NavLink to="/app/admin/students" onClick={closeMobileMenu}>
                Students
              </NavLink>
              <NavLink to="/app/admin/supervisors" onClick={closeMobileMenu}>
                Supervisors
              </NavLink>
              <NavLink to="/app/admin/applications" onClick={closeMobileMenu}>
                Applications
              </NavLink>
              <NavLink to="/app/admin/analytics" onClick={closeMobileMenu}>
                Analytics
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          {(user?.role === "supervisor" || user?.role === "student" || user?.role === "admin") && (
            <NavLink
              className="sidebar-footer-link"
              onClick={closeMobileMenu}
              to={
                user?.role === "supervisor"
                  ? "/app/supervisor/profile"
                  : user?.role === "student"
                    ? "/app/student/profile"
                    : "/app/admin/profile"
              }
            >
              My profile
            </NavLink>
          )}
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content" onClick={closeMobileMenu}>
        <header className="topbar">
          <div>
            <h2>Welcome, {user?.email}</h2>
            <p>Role: {user?.role}</p>
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
