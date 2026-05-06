import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/client";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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

  // Apply sidebar enhancement styles directly
  useEffect(() => {
    const enhanceSidebar = () => {
      try {
        const sidebar = document.querySelector('.sidebar');
        const sidebarUser = document.querySelector('.sidebar-user');
        const avatar = document.querySelector('.sidebar-user .avatar');
        const userMeta = document.querySelector('.user-meta');
        const email = document.querySelector('.user-email');
        const role = document.querySelector('.role-badge');

        // Apply glassmorphism to main sidebar
        if (sidebar) {
          sidebar.style.background = 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)';
          sidebar.style.boxShadow = '4px 0 10px rgba(0,0,0,0.1)';
        }

        // Enhanced user profile container with glassmorphism
        if (sidebarUser) {
          sidebarUser.style.background = 'rgba(255, 255, 255, 0.03)';
          sidebarUser.style.margin = '10px 12px 20px 12px';
          sidebarUser.style.borderRadius = '12px';
          sidebarUser.style.border = '1px solid rgba(255, 255, 255, 0.05)';
          sidebarUser.style.transition = 'all 0.3s ease';
          sidebarUser.style.cursor = 'pointer';
          sidebarUser.style.backdropFilter = 'blur(10px)';
          sidebarUser.style.position = 'relative';
          sidebarUser.style.overflow = 'hidden';
        }

        // Enhanced avatar with depth and glow effects
        if (avatar) {
          avatar.style.width = '36px';
          avatar.style.height = '36px';
          avatar.style.backgroundColor = '#4ade80';
          avatar.style.color = '#064e3b';
          avatar.style.display = 'flex';
          avatar.style.alignItems = 'center';
          avatar.style.justifyContent = 'center';
          avatar.style.borderRadius = '8px';
          avatar.style.fontWeight = 'bold';
          avatar.style.flexShrink = '0';
          avatar.style.boxShadow = '0 0 15px rgba(74, 222, 128, 0.2)';
          avatar.style.border = '2px solid rgba(74, 222, 128, 0.1)';
          avatar.style.fontFamily = 'system-ui, -apple-system, sans-serif';
          avatar.style.position = 'relative';
          avatar.style.zIndex = '2';
          avatar.style.transition = 'all 0.3s ease';
        }

        // Enhanced user meta layout
        if (userMeta) {
          userMeta.style.display = 'flex';
          userMeta.style.flexDirection = 'column';
          userMeta.style.gap = '2px';
          userMeta.style.overflow = 'hidden';
          userMeta.style.position = 'relative';
          userMeta.style.zIndex = '1';
        }

        // Enhanced email styling
        if (email) {
          email.style.fontSize = '13px';
          email.style.color = '#f8fafc';
          email.style.whiteSpace = 'nowrap';
          email.style.overflow = 'hidden';
          email.style.textOverflow = 'ellipsis';
          email.style.fontWeight = '500';
          email.style.opacity = '0.9';
          email.style.transition = 'all 0.2s ease';
        }

        // Enhanced role badge with glassmorphism
        if (role) {
          role.style.fontSize = '11px';
          role.style.textTransform = 'uppercase';
          role.style.letterSpacing = '0.05em';
          role.style.color = '#4ade80';
          role.style.fontWeight = '700';
          role.style.background = 'rgba(74, 222, 128, 0.1)';
          role.style.padding = '2px 8px';
          role.style.borderRadius = '20px';
          role.style.display = 'inline-flex';
          role.style.width = 'fit-content';
          role.style.backdropFilter = 'blur(5px)';
          role.style.border = '1px solid rgba(74, 222, 128, 0.2)';
          role.style.position = 'relative';
          role.style.transition = 'all 0.3s ease';
        }

        console.log('✅ Sidebar user profile enhanced with glassmorphism and depth effects');
      } catch (error) {
        console.error('❌ Error enhancing sidebar user profile:', error);
      }
    };

    // Apply enhancements after component mounts
    const timer = setTimeout(enhanceSidebar, 100);
    
    return () => clearTimeout(timer);
  }, []);

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
      <button 
        className="mobile-menu-toggle" 
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        ☰
      </button>
      
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} aria-label="Primary navigation">
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
            <NavLink to="/app/dashboard" onClick={closeMobileMenu}>📊 Dashboard</NavLink>
            <NavLink to="/app/enhanced-dashboard" onClick={closeMobileMenu}>📈 Stats Avancées</NavLink>
          </div>

          <div className="nav-group">
            <div className="nav-group-title">{user?.role === "supervisor" ? "🏗️ Projets" : "🎯 Stagiaire"}</div>
            {user?.role === "student" && <NavLink to="/app/student/my-project" onClick={closeMobileMenu}>🏢 Mon Projet</NavLink>}
            {user?.role === "supervisor" && <NavLink to="/app/supervisor/my-projects" onClick={closeMobileMenu}>🏗️ Mes Projets</NavLink>}
            {user?.role === "supervisor" && (
              <button 
                className="add-intern-btn" 
                onClick={() => {
                  closeMobileMenu();
                  navigate('/app/supervisor/add-intern');
                }}
              >
                ➕ Ajouter un stagiaire
              </button>
            )}
          </div>

          <div className="nav-group">
            <div className="nav-group-title">✅ Travail</div>
            <NavLink to="/app/notifications" onClick={closeMobileMenu}>🔔 Notifications</NavLink>
            {(user?.role === "supervisor" || user?.role === "student") && (
              <div className="nav-link-with-badge">
                <NavLink to="/app/tasks" onClick={closeMobileMenu}>📝 Tasks</NavLink>
                {unreadCount > 0 && (
                  <span className="notification-badge" title={`${unreadCount} unread notifications`}>
                    🔴 {unreadCount}
                  </span>
                )}
              </div>
            )}
            {(user?.role === "supervisor" || user?.role === "student") && (
              <NavLink to="/app/reports" onClick={closeMobileMenu}>📊 Reports</NavLink>
            )}
          </div>

          {/* Admin Management Links */}
          {user?.role === "admin" && (
            <div className="nav-group">
              <div className="nav-group-title">🔐 Administration</div>
              <NavLink 
                to="/app/admin/students" 
                onClick={closeMobileMenu}
                className="admin-nav-link"
              >
                <span className="nav-icon">👥</span>
                Gérer les Stagiaires
              </NavLink>
              <NavLink 
                to="/app/admin/supervisors" 
                onClick={closeMobileMenu}
                className="admin-nav-link"
              >
                <span className="nav-icon">👨‍🏫</span>
                Gérer les Superviseurs
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          {(user?.role === "supervisor" || user?.role === "student" || user?.role === "company" || user?.role === "admin") && (
            <NavLink 
              className="sidebar-footer-link" 
              onClick={closeMobileMenu}
              to={
                user?.role === "supervisor" ? "/app/supervisor/profile" :
                user?.role === "student" ? "/app/student/profile" :
                user?.role === "company" ? "/app/company/profile" :
                "/app/admin/profile"
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

      <main className="content" onClick={closeMobileMenu}>
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
