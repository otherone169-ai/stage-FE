import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ApplicationsPage from "./pages/ApplicationsPage";
import AdminApplicationsPage from "./pages/AdminApplicationsPage";
import AdminRhCompaniesPage from "./pages/AdminRhCompaniesPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import CompanyInternsPage from "./pages/CompanyInternsPage";
import CompanyInternshipsPage from "./pages/CompanyInternshipsPage";
import CompanyApplicationsPage from "./pages/CompanyApplicationsPage";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import InternshipsPage from "./pages/InternshipsPage";
import InternsPage from "./pages/InternsPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReportsPage from "./pages/ReportsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import StudentProgressPage from "./pages/StudentProgressPage";
import SupervisorProfilePage from "./pages/SupervisorProfilePage";
import SupervisorsPage from "./pages/SupervisorsPage";
import TasksPage from "./pages/TasksPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />

    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/app/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route
        path="internships"
        element={<InternshipsPage />}
      />
      <Route
        path="admin/overview"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Navigate to="/app/admin/rh-companies" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/rh-companies"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminRhCompaniesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/students"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminStudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/applications"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="student/profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="student/applications"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="student/progress"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="company/profile"
        element={
          <ProtectedRoute allowedRoles={["company"]}>
            <CompanyProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="company/internships"
        element={
          <ProtectedRoute allowedRoles={["company"]}>
            <CompanyInternshipsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/supervisors"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <SupervisorsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="company/interns"
        element={
          <ProtectedRoute allowedRoles={["company"]}>
            <CompanyInternsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="company/applications"
        element={
          <ProtectedRoute allowedRoles={["company"]}>
            <CompanyApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="supervisor/profile"
        element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <SupervisorProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="supervisor/interns"
        element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <InternsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="tasks"
        element={
          <ProtectedRoute allowedRoles={["student", "supervisor"]}>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="reports"
        element={
          <ProtectedRoute allowedRoles={["student", "supervisor"]}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
