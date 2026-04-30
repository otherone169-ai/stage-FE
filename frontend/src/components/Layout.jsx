import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-dot" />
          <div>
            <h1>StageFlow</h1>
            <p>Gestion stagiaires</p>
          </div>
        </div>

        <nav className="nav-links">
          <NavLink to="/app/dashboard">Dashboard</NavLink>
          {user?.role === "admin" && <NavLink to="/app/admin/rh-companies">RH & Companies</NavLink>}
          {user?.role === "admin" && <NavLink to="/app/admin/students">Registered Students</NavLink>}
          {user?.role === "admin" && <NavLink to="/app/admin/applications">Applications</NavLink>}
          {user?.role === "admin" && <NavLink to="/app/admin/supervisors">Supervisors</NavLink>}
          {user?.role !== "company" && <NavLink to="/app/internships">Internships</NavLink>}
          {user?.role === "student" && (
            <NavLink to="/app/student/profile">My Profile</NavLink>
          )}
          {user?.role === "student" && (
            <NavLink to="/app/student/applications">My Applications</NavLink>
          )}
          {user?.role === "student" && (
            <NavLink to="/app/student/progress">My Progress</NavLink>
          )}
          {user?.role === "company" && (
            <NavLink to="/app/company/profile">Company Profile</NavLink>
          )}
          {user?.role === "company" && (
            <NavLink to="/app/company/internships">Manage Internships</NavLink>
          )}
          {user?.role === "company" && (
            <NavLink to="/app/company/applications">Review Applications</NavLink>
          )}
          {user?.role === "company" && (
            <NavLink to="/app/company/interns">Monitor Interns</NavLink>
          )}
          {user?.role === "supervisor" && (
            <NavLink to="/app/supervisor/profile">My Profile</NavLink>
          )}
          {user?.role === "supervisor" && (
            <NavLink to="/app/supervisor/interns">My Interns</NavLink>
          )}
          {(user?.role === "supervisor" || user?.role === "student") && (
            <NavLink to="/app/tasks">Tasks</NavLink>
          )}
          {(user?.role === "supervisor" || user?.role === "student") && (
            <NavLink to="/app/reports">Reports</NavLink>
          )}
        </nav>

        <button type="button" className="logout-btn" onClick={handleLogout}>
          Se deconnecter
        </button>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h2>Bienvenue, {user?.email}</h2>
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
