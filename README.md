# 🎓 StageFlow - Internship Management Platform

**Plateforme de gestion de stagiaires** — A comprehensive web-based system for managing internship programs, student placements, and professional development workflows.

**Status:** Production-Ready | **Version:** 1.0.0 | **Last Updated:** May 2026

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Users & Roles](#-users--roles)
4. [Use Cases](#-use-cases)
5. [Architecture](#-architecture)
6. [Tech Stack](#-tech-stack)
7. [Project Structure](#-project-structure)
8. [Getting Started](#-getting-started)
9. [API Routes](#-api-routes)
10. [Database Schema](#-database-schema)

---

## 🎯 Project Overview

**StageFlow** is an end-to-end internship management platform designed to streamline the recruitment, onboarding, tracking, and evaluation of student interns across organizations. It bridges the gap between educational institutions, companies, supervisors, and students by providing a centralized workspace for managing internship lifecycles.

### Core Objectives

- **Centralize** internship data across organizations and educational partners
- **Automate** administrative workflows (applications, approvals, notifications)
- **Track** intern progress through projects, tasks, and milestones
- **Enable** real-time communication and feedback between supervisors and students
- **Generate** comprehensive reports for compliance and performance analysis
- **Secure** sensitive data with role-based access control (RBAC) and authentication

---

## ✨ Key Features

### For Students
- **User Profiles**: Register, update CV, and manage personal information
- **Apply to Internships**: Browse and apply to open positions at companies
- **Progress Tracking**: View assigned tasks, projects, and overall progress
- **Performance Feedback**: Receive real-time feedback and task ratings from supervisors
- **Document Submissions**: Upload reports and deliverables
- **Notifications**: Real-time alerts for application status, task assignments, and messages

### For Supervisors
- **Internship Management**: Create and manage internship programs
- **Student Recruitment**: Review applications, approve/reject candidates
- **Team Setup**: Add students to internships and assign projects
- **Task Assignment**: Create tasks, set deadlines, and track completion
- **Performance Monitoring**: Rate student work, provide feedback, monitor progress
- **Reporting**: Generate and export performance reports for internal review

### For Companies
- **Company Profiles**: Manage company information and internship offerings
- **Job Listings**: Post internship positions and manage applications
- **Dashboard Analytics**: View application counts, acceptance rates, and candidate pools
- **Supervisor Management**: Add supervisors and manage their roles

### For Administrators
- **User Management**: Create, modify, and deactivate user accounts
- **System Oversight**: Monitor all users, applications, and internships
- **Data Export**: Generate reports for compliance and audit purposes
- **Role Management**: Assign and revoke user roles and permissions

---

## 👥 Users & Roles

| Role | Description | Key Responsibilities |
|------|-------------|----------------------|



### User Journey by Role

#### 📚 Student User Journey
1. **Registration** → Create account or register via invitation
2. **Profile Setup** → Complete profile, upload CV
3. **Browse** → View available internship positions  ----
4. **Apply** → Submit applications to positions of interest ----
5. **Await Approval** → Monitor application status
6. **Start Internship** → Receive project and task assignments
7. **Execute Work** → Complete assigned tasks, submit deliverables
8. **Receive Feedback** → Get ratings and supervisor comments
9. **End Program** → Receive completion certificate and final report

#### 🏢 Supervisor User Journey
1. **Registration** → Register as supervisor for company
2. **Setup** → Create internship programs, add company details
3. **Recruit** → Post positions, review applications, approve candidates
4. **Onboard** → Add students to internships, assign initial projects
5. **Manage** → Create and track tasks, monitor progress
6. **Evaluate** → Provide feedback, rate student work
7. **Report** → Generate and export performance reports



---

## 🎨 Use Cases

### Use Case 1: Internship Application & Recruitment
**Actors:** Student, Supervisor, Company HR  
**Trigger:** Company posts new internship position  
**Flow:**
1. Supervisor creates internship program with details (duration, location, requirements)
2. HR team posts job listing with competency requirements
3. Students browse available internships and submit applications
4. Supervisor reviews applications with scoring system
5. Top candidates receive approval notifications
6. Selected students confirm participation and receive onboarding info

**Expected Outcome:** Qualified students matched with internship positions

---

### Use Case 2: Project & Task Management
**Actors:** Supervisor, Student  
**Trigger:** Student starts internship  
**Flow:**
1. Supervisor creates project for internship (e.g., "Website Redesign")
2. Supervisor breaks project into tasks with:
   - Detailed descriptions and acceptance criteria
   - Deadlines and priority levels
   - Required deliverables (code, documents, reports)
3. Student receives task notifications
4. Student works on tasks and uploads deliverables
5. Supervisor reviews submissions and provides feedback
6. Student iterates based on feedback until completion

**Expected Outcome:** Completed project deliverables with documented progress

---

### Use Case 3: Performance Tracking & Feedback
**Actors:** Supervisor, Student  
**Trigger:** Student completes task or milestone  
**Flow:**
1. Supervisor reviews completed task/deliverable
2. Supervisor rates work (1-5 stars) on quality, timeliness, adherence to requirements
3. Supervisor adds written feedback and improvement suggestions
4. System aggregates ratings and trends (progress over time)
5. Student receives feedback notifications and can respond
6. Dashboard shows real-time performance metrics

**Expected Outcome:** Transparent performance visibility; constructive feedback loop

---

### Use Case 4: Compliance & Reporting
**Actors:** Supervisor, Admin  
**Trigger:** End of internship period or reporting deadline  
**Flow:**
1. Supervisor accesses report generation tool
2. Supervisor selects internship, time period, and report type
3. System generates comprehensive report including:
   - Student participation and hours tracked
   - Task completion rates and deliverables
   - Performance ratings and feedback
   - Attendance records
   - Final evaluation
4. Supervisor exports report (PDF/CSV) for institutional records
5. Admin can audit all generated reports

**Expected Outcome:** Compliant audit trail; evidence of internship completion

---

### Use Case 5: Real-Time Communication & Notifications
**Actors:** All roles  
**Trigger:** Application status change, task assignment, feedback posted  
**Flow:**
1. Event occurs in system (e.g., task deadline approaching)
2. System queues notification via:
   - In-app notification (WebSocket/real-time)
   - Email notification
   - Optional SMS alert
3. User receives notification across all channels
4. User can interact (view details, take action) from notification

**Expected Outcome:** Timely information delivery; no missed critical updates

---

### Use Case 6: Multi-Supervisor Coordination
**Actors:** Multiple Supervisors, Admin  
**Trigger:** Large internship program or cross-team project  
**Flow:**
1. Admin creates internship with multiple supervisors
2. Each supervisor manages a subset of students/projects
3. Supervisors can:
   - View shared project progress
   - Delegate tasks across team
   - Share resources and documentation
   - Coordinate feedback and evaluations
4. Dashboard shows aggregated team performance

**Expected Outcome:** Coordinated management of large-scale internship programs

---

## 🏗️ Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages: Login, Dashboard, Applications, Tasks, etc.  │   │
│  │  Components: Forms, Cards, Tables, Modals            │   │
│  │  State: Auth Context, API Client (Axios)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS/API
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes: /api/auth, /api/students, /api/supervisors │   │
│  │ Controllers: Business Logic & Validation            │   │
│  │ Middleware: Authentication, CORS, Rate Limiting     │   │
│  │ Services: Email, File Upload, Notifications         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ SQL
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tables: users, internships, applications, tasks,     │   │
│  │         projects, students, supervisors, reports     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Tech Stack

### Frontend
- **Framework:** React 18.3 with Hooks
- **Router:** React Router v6 (client-side routing)
- **Build Tool:** Vite 5.4 (fast ES module bundling)
- **HTTP Client:** Axios (REST API calls)
- **Styling:** CSS3 with CSS Variables (dark mode support)
- **Runtime:** Node.js / Browser

### Backend
- **Runtime:** Node.js 20 (Alpine)
- **Framework:** Express.js 4.19
- **Database:** PostgreSQL 15+
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** Joi (schema validation)
- **File Upload:** Multer
- **Email:** Nodemailer
- **Real-Time:** Socket.io 4.8 (for notifications)
- **Rate Limiting:** express-rate-limit
- **Testing:** Vitest + Supertest

### DevOps
- **Containerization:** Docker + Docker Compose
- **Database Migrations:** Custom Node.js scripts
- **Database Seeding:** Demo and comprehensive seed scripts
- **Linting:** Custom Node.js linter
- **Development Server:** Nodemon (auto-reload on changes)

---

## 📁 Project Structure

```
Stage-FE/
├── backend/                          # Node.js API Server
│   ├── src/
│   │   ├── app.js                   # Express app setup
│   │   ├── server.js                # Server entry point
│   │   ├── config/db.js             # PostgreSQL connection
│   │   ├── controllers/             # Business logic (auth, students, supervisors, etc.)
│   │   │   └── v2/                  # V2 API endpoints
│   │   ├── routes/                  # API route definitions
│   │   │   └── v2/
│   │   ├── middlewares/             # Auth, validation, error handling
│   │   ├── validations/             # Joi schemas for request validation
│   │   ├── utils/                   # Logger, mailer, audit
│   │   └── sockets/                 # WebSocket handlers (real-time)
│   ├── migrations/                  # Database schema migrations
│   ├── scripts/                     # Seeding, migration, linting scripts
│   ├── tests/                       # Unit & integration tests
│   ├── Dockerfile                   # Container image
│   └── package.json
│
├── frontend/                        # React SPA
│   ├── src/
│   │   ├── App.jsx                 # Root component + routing
│   │   ├── main.jsx                # Vite entry point
│   │   ├── api/client.js           # Axios API client
│   │   ├── components/             # Reusable UI components
│   │   │   ├── FormField.jsx       # Form input with icons
│   │   │   ├── StatusBadge.jsx     # Status indicators
│   │   │   ├── InfoCard.jsx        # Metric cards
│   │   │   ├── LoadingSpinner.jsx  # Loading state
│   │   │   ├── Layout.jsx          # Main layout wrapper
│   │   │   └── ProtectedRoute.jsx  # Auth guard
│   │   ├── context/AuthContext.jsx # Auth state management
│   │   ├── hooks/useAuth.js        # Auth logic hook
│   │   ├── pages/                  # Page components
│   │   │   ├── LoginPage.jsx       # Auth entry
│   │   │   ├── RegisterPage.jsx    # Supervisor signup
│   │   │   ├── DashboardPage.jsx   # Main dashboard
│   │   │   ├── ApplicationsPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   └── ... (other pages)
│   │   ├── styles.css              # Global design system
│   │   └── index.html              # HTML template
│   ├── Dockerfile                  # Container image (nginx + static)
│   ├── vite.config.js              # Vite build config
│   └── package.json
│
├── docker-compose.yml              # Multi-container orchestration
├── COMPREHENSIVE_AUDIT.md          # Full audit report
└── README.md                        # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if running without Docker)
- Git

### Quick Start with Docker

```bash
# Clone repository
git clone <repo-url>
cd Stage-FE

# Build and start containers
docker compose up -d --build

# Backend: http://localhost:3000
# Frontend: http://localhost:5173 (dev) or http://localhost:80 (production)
```

### Local Development Setup

#### Backend
```bash
cd backend
npm install
npm run migrate       # Run database migrations
npm run seed:demo    # Load demo data
npm run dev          # Start dev server (auto-reload)
```

#### Frontend
```bash
cd frontend
npm install
npm run dev          # Start Vite dev server
```

### Environment Variables

Create `.env` file in backend root:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/stageflow
JWT_SECRET=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🔌 API Routes

### Authentication (`/api/auth`)
- `POST /register` — Create new user account
- `POST /login` — User authentication
- `POST /refresh-token` — Refresh JWT token
- `POST /forgot-password` — Request password reset
- `POST /reset-password` — Reset password with token
- `POST /verify-email` — Verify email address
- `POST /set-password` — Set initial password (invite link)

### Students (`/api/students`)
- `GET /` — List all students
- `GET /:id` — Get student profile
- `PUT /:id` — Update student profile
- `GET /applications` — List my applications
- `GET /internships` — List my internships
- `POST /:id/upload-cv` — Upload CV file

### Supervisors (`/api/supervisors`)
- `GET /` — List supervisors
- `POST /` — Create new supervisor
- `GET /:id` — Get supervisor profile
- `PUT /:id` — Update supervisor profile
- `GET /:id/internships` — Get supervisor's internships
- `GET /:id/students` — Get students managed by supervisor

### Internships (`/api/internships`)
- `GET /` — List internships
- `POST /` — Create new internship
- `GET /:id` — Get internship details
- `PUT /:id` — Update internship
- `POST /:id/applications` — Get applications for internship
- `POST /:id/students` — Add student to internship
- `DELETE /:id/students/:studentId` — Remove student

### Applications (`/api/applications`)
- `GET /` — List applications
- `POST /` — Submit application
- `GET /:id` — Get application details
- `PUT /:id/approve` — Approve application
- `PUT /:id/reject` — Reject application

### Projects (`/api/projects`)
- `GET /` — List projects
- `POST /` — Create project
- `GET /:id` — Get project details
- `PUT /:id` — Update project
- `DELETE /:id` — Delete project

### Tasks (`/api/tasks`)
- `GET /` — List tasks
- `POST /` — Create task
- `GET /:id` — Get task details
- `PUT /:id` — Update task
- `PUT /:id/status` — Update task status
- `POST /:id/submissions` — Submit deliverable
- `PUT /:id/rate` — Rate completed task

### Reports (`/api/reports`)
- `GET /` — List reports
- `POST /` — Generate report
- `GET /:id` — Get report details
- `GET /:id/export` — Export report (PDF/CSV)

### Dashboard (`/api/dashboard`)
- `GET /` — Get dashboard stats and metrics
- `GET /overview` — Get system overview

### Admin (`/api/admin`)
- `GET /users` — List all users
- `POST /users` — Create user
- `PUT /users/:id` — Update user
- `DELETE /users/:id` — Deactivate user
- `GET /reports` — System reports

---

## 🗄️ Database Schema

### Core Tables

#### `users`
- `id` (UUID, PK)
- `email` (unique)
- `password_hash`
- `full_name`
- `role` (student, supervisor, admin, company_hr)
- `created_at`, `updated_at`

#### `students`
- `id` (UUID, PK)
- `user_id` (FK)
- `cv_path`
- `bio`
- `phone`
- `created_at`, `updated_at`

#### `supervisors`
- `id` (UUID, PK)
- `user_id` (FK)
- `company_id` (FK)
- `position`
- `department`
- `created_at`, `updated_at`

#### `internships`
- `id` (UUID, PK)
- `company_id` (FK)
- `title`
- `description`
- `start_date`
- `end_date`
- `status` (open, in_progress, completed)
- `created_at`, `updated_at`

#### `applications`
- `id` (UUID, PK)
- `internship_id` (FK)
- `student_id` (FK)
- `status` (submitted, approved, rejected)
- `applied_at`
- `created_at`, `updated_at`

#### `interns`
- `id` (UUID, PK)
- `internship_id` (FK)
- `student_id` (FK)
- `supervisor_id` (FK)
- `status` (active, completed, terminated)
- `start_date`, `end_date`
- `created_at`, `updated_at`

#### `projects`
- `id` (UUID, PK)
- `internship_id` (FK)
- `supervisor_id` (FK)
- `title`
- `description`
- `created_at`, `updated_at`

#### `tasks`
- `id` (UUID, PK)
- `project_id` (FK)
- `title`
- `description`
- `deadline`
- `status` (pending, in_progress, completed, reviewed)
- `priority` (low, medium, high)
- `created_at`, `updated_at`

#### `task_submissions`
- `id` (UUID, PK)
- `task_id` (FK)
- `submitted_by` (FK to users)
- `file_path`
- `submitted_at`
- `rating` (1-5)
- `feedback`
- `created_at`, `updated_at`

#### `reports`
- `id` (UUID, PK)
- `internship_id` (FK)
- `generated_by` (FK)
- `report_type` (performance, compliance, etc.)
- `content_path`
- `created_at`, `updated_at`

---

## 🔐 Security Features

- **Authentication:** JWT-based with refresh tokens
- **Authorization:** Role-based access control (RBAC)
- **Password Security:** bcrypt hashing with salt
- **CORS:** Whitelist allowed origins
- **Rate Limiting:** Prevent abuse and DDoS attacks
- **Input Validation:** Joi schema validation on all requests
- **SQL Injection Prevention:** Parameterized queries (pg library)
- **File Security:** Random file names, type validation, secure storage
- **Email Verification:** Required for account activation
- **Password Reset:** Token-based with expiration (see audit report for pending fixes)

---

## 📊 Workflow & Service Parts

### Coming Next:
Detailed analysis of:
- **Workflow Engines** (application approval, task completion, status transitions)
- **Service Layer** (authentication, email, file management, reporting)
- **Real-Time Services** (WebSocket notifications, live updates)
- **Integration Points** (external APIs, third-party services)

---

## 📝 License

Private Project — All Rights Reserved

---

## 👨‍💻 Development Team

**Version:** 1.0.0  
**Last Updated:** May 2026  
**Contact:** [Project Owner]

---

## 🐛 Known Issues

See [COMPREHENSIVE_AUDIT.md](./COMPREHENSIVE_AUDIT.md) for:
- Critical issues requiring immediate fixes
- High-priority improvements
- Medium/low-priority enhancements
- Security vulnerabilities and patches

---

## 📞 Support

For issues, questions, or feature requests, please refer to the issue tracker or contact the development team.