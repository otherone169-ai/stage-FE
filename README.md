# Plateforme de gestion de stagiaires

Application full-stack de gestion de stagiaires avec authentification JWT, gestion des roles, dashboard et workflows taches/rapports.

## 1) Architecture (scalable MVC)

### Backend (Node.js + Express + PostgreSQL)
- Architecture MVC simple et evolutive:
  - `routes`: declaration REST API
  - `controllers`: logique metier et orchestration SQL
  - `middlewares`: auth JWT, autorisation par role, validation, gestion erreurs
  - `validations`: schemas Joi
  - `config`: connexion PostgreSQL
- Authentification:
  - JWT Bearer token
  - middleware d'authentification + middleware RBAC (`admin`, `company`, `supervisor`, `student`)
- API REST:
  - Auth, stagiaires, superviseurs, taches, rapports, dashboard

### Frontend (React + Vite)
- React avec hooks modernes
- Separation claire:
  - `pages`: ecrans metier
  - `components`: composants reutilisables
  - `context`: gestion auth globale
  - `api`: client axios centralise
- UX:
  - routes protegees
  - etats de chargement
  - gestion erreurs API
  - dashboard moderne responsive

## 2) Fonctionnalites implementees

### Authentification
- Inscription
- Connexion
- Recup info utilisateur courant
- Changement de mot de passe en session
- Roles: admin / company / supervisor / student

### Gestion des stagiaires par RH de la company (user = RH)
- Creer stagiaire
- Lister stagiaires
- Consulter stagiaire
- Modifier stagiaire
- Supprimer stagiaire
- Assigner stagier au superviseur

### Supervision des superviseurs (user = admin)
- Lister les superviseurs de la plateforme
- Consulter les details d'un superviseur avec ses stagiaires assignes
- Modifier les informations d'un superviseur
- Supprimer un superviseur

### Vue admin des candidatures
- Consulter les candidatures de differents etudiants sur l'ensemble de la plateforme
- Voir le stage vise, l'entreprise, le statut et le superviseur eventuellement assigne

### Gestion des Projets (user = supervisor)
- Créer projet pour une internship (scoped à l'entreprise du supervisor)
- Lister projets du supervisor
- Consulter details projet
- Modifier projet
- Supprimer projet

### Gestion des Taches (user = supervisor + student)
- user = supervisor -> Créer tache pour un projet
- Les deux users -> Lister taches (filtrees par role + permissions)
- user = supervisor -> Modifier tache
- user = supervisor + student -> Mettre a jour statut: `todo`, `in_progress`, `done`
- user = supervisor + student -> Ajouter remarque/commentaire sur une tache
- user = supervisor -> Supprimer tache ou remarque
- user = supervisor -> Consulter remarques sur une tache

### Gestion des Rapports (user = student + supervisor)
**Student**:
- Créer rapport (draft)
- Lister ses propres rapports
- Modifier rapport (draft only)
- Soumettre rapport pour validation

**Supervisor**:
- Lister rapports en attente de validation
- Valider/rejeter rapport avec feedback

### Dashboard admin (role-aware analytics)
- Statistiques globales:
  - Nombre total de stagiaires
  - Nombre total de superviseurs (par company)
  - Taches totales/faites + progression
  - Applications pending/accepted/rejected
  - Superviseurs distribution par company
- Statistiques scoped (company role):
  - Nombre de stagiaires dans internships de la company
  - Superviseurs de la company
  - Taches et progression within company scope  

## 3) API principale (V2)

Base URL backend: `http://localhost:5000/api`

### Authentication
- `POST /auth/register` (roles: student, company)
- `POST /auth/login`
- `POST /auth/password/change`
- `POST /auth/email-verification/confirm`
- `POST /auth/email-verification/request`
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`
- `GET /auth/me`

### Students
- `GET /students/me`
- `PUT /students/me`
- `GET /students/recommendations`
- `GET /students/applications`
- `GET /students/progress`
- `POST /students/tasks/:taskId/updates`

### Companies (RH Management)
- `GET /companies/me`
- `PUT /companies/me`
- `GET /companies/interns/monitor`

### Supervisors (Admin + Supervisor Self-Service)
**Admin Management**:
- `GET /supervisors` - List supervisors (admin only)
- `GET /supervisors/:id` - Get supervisor details (admin only)
- `PATCH /supervisors/:id` - Update supervisor (admin only)
- `DELETE /supervisors/:id` - Delete supervisor (admin only)

**Supervisor Self-Service**:
- `GET /supervisors/profile/me` - Get own profile
- `PATCH /supervisors/profile/me` - Update own profile
- `GET /supervisors/interns/list` - List assigned interns with project info
- `POST /supervisors/interns/:internId/evaluations` - Add feedback/evaluation

### Projects (Supervisor-owned)
- `POST /projects` - Create project for internship
- `GET /projects` - List supervisor's projects
- `GET /projects/:id` - Get project details
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Tasks (Supervisor create + Student/Supervisor update)
- `POST /tasks` - Create task (supervisor only)
- `GET /tasks` - List tasks (role-filtered)
- `GET /tasks/:id` - Get task details
- `PATCH /tasks/:id` - Update task (supervisor only)
- `PATCH /tasks/:id/status` - Update task status: `todo`, `in_progress`, `done` (supervisor + student)
- `DELETE /tasks/:id` - Delete task (supervisor only)

### Task Remarks/Comments
- `POST /tasks/:taskId/remarks` - Add comment (supervisor + student)
- `GET /tasks/:taskId/remarks` - List task comments
- `DELETE /tasks/remarks/:remarkId` - Delete remark (creator or supervisor)

### Reports (Student create + Supervisor validate)
**Student Operations**:
- `POST /reports` - Create report (draft)
- `GET /reports/my` - List own reports
- `PATCH /reports/:id` - Update report (draft only)
- `PATCH /reports/:id/submit` - Submit report for validation

**Supervisor Operations**:
- `GET /reports/validation/list` - List pending reports to validate
- `PATCH /reports/:id/validate` - Approve/reject report with feedback

### Internships
- `GET /internships` (filters + pagination; supervisor results are scoped to supervisor company)
- `POST /internships`
- `GET /internships/my`
- `PATCH /internships/:id/moderation` (admin)

### Applications
- `POST /applications` (student apply)
- `GET /applications/internships/:internshipId/applicants`
- `PATCH /applications/:applicationId/review`
- `PATCH /applications/interns/:internId/assign-supervisor`

### Notifications
- `GET /notifications`
- `PATCH /notifications/:id/read`

### Messages
- `POST /messages`
- `GET /messages/conversation/:userId`

### Admin
- `GET /admin/users`
- `GET /admin/applications`
- `PATCH /admin/users/:userId/status`
- `DELETE /admin/users/:userId`
- `GET /admin/analytics`

### Dashboard
- `GET /dashboard` - Role-aware analytics (admin: global, company/supervisor/student: scoped)

## 3.1) Comptes de Test (Seeded Data)

Le projet inclut un fichier seed complet (`backend/sql/seed-comprehensive.sql`) avec données multi-roles réalistes:

**Comptes Disponibles** (password: `password123` sauf indiqué):

| Email | Password | Role | Company | Notes |
|-------|----------|------|---------|-------|
| admin@stageflow.com | AdminPassword123 | admin | - | Full system access, dashboard analytics |
| rh.alpha@company.com | CompanyPass123 | company | Alpha Tech | HR/RH access, supervisor management |
| rh.beta@company.com | CompanyPass123 | company | Beta Corp | HR/RH access, supervisor management |
| sup.alpha.1@stageflow.com |   | supervisor | Alpha Tech | Project/task management, intern evaluation |
| sup.alpha.2@stageflow.com | SupervisorPass123 | supervisor | Alpha Tech | Project/task management, intern evaluation |
| sup.beta.1@stageflow.com | SupervisorPass123 | supervisor | Beta Corp | Project/task management, intern evaluation |
| sup.beta.2@stageflow.com | SupervisorPass123 | supervisor | Beta Corp | Project/task management, intern evaluation |
| student1@univ.edu | StudentPass123 | student | - | Task updates, report submission, apply to internships |
| student2@univ.edu | StudentPass123 | student | - | Task updates, report submission, apply to internships |
| student3@univ.edu | StudentPass123 | student | - | Task updates, report submission, apply to internships |
| student4@univ.edu | StudentPass123 | student | - | Task updates, report submission, apply to internships |
| student5@univ.edu | StudentPass123 | student | - | Task updates, report submission, apply to internships |
| student6@univ.edu | StudentPass123 | student | - | Task updates, report submission, apply to internships |


----
Bienvenue, student1@univ.edu = StudentPass123
Role: student
Bienvenue, sup.alpha.1@stageflow.com = SupervisorPass123
Role: supervisor
Bienvenue, admin@stageflow.com = AdminPassword123
Role: admin
Bienvenue, rh.alpha@company.com = CompanyPass123
Role: company
----
**Données de Test Déjà Configurées**:
- 2 companies (Alpha Tech, Beta Corp)
- 4 supervisors (2 per company)
- 6 students
- 4 internships
- 6 applications (mixed status)
- 3 projects
- 3 interns
- 6 tasks (mixed statuses)
- 3 task remarks/comments
- 2 reports

Pour charger les données de test dans Docker:
```bash
docker compose up -d postgres
docker compose exec -T postgres psql -U stageflow -d stageflow < backend/sql/seed-comprehensive.sql
```

## 4) Schema relationnel PostgreSQL

Tables:
- `users` - Utilisateurs (admin, company, supervisor, student)
- `students` - Profils de stagiaires
- `companies` - Profils d'entreprises
- `supervisors` - Superviseurs assignés aux entreprises
- `internships` - Offres de stage
- `applications` - Candidatures de stagiaires
- `projects` - Projets créés par supervisors pour internships
- `interns` - Stagiaires assignés à des internships (lien student + internship)
- `tasks` - Taches créées par supervisors pour projects
- `task_remarks` - Commentaires sur les taches (supervisor + student)
- `reports` - Rapports de stage créés par students
- `feedbacks` - Evaluations/feedbacks supervisors sur stagiaires
- `documents` - Documents uploaded
- `notifications` - Notifications utilisateurs
- `messages` - Messages entre utilisateurs
- `matches` - Matchs stagiaire/internship
- `audit_logs` - Historique des actions
- `password_reset_tokens` - Tokens pour reset password

Contraintes:
- UUID sur toutes les PK
- Clés étrangères pour toutes les relations
- Checks sur les roles/statuts/ratings
- Contrainte d'unicité sur candidatures (`student_id`, `internship_id`)
- Indexes sur colonnes critiques (FK, status, role)

## 5) Structure du projet

```text
Stage-FE/
  backend/
    src/
      config/
      controllers/
        v2/
      middlewares/
      routes/
        v2/
      validations/
        v2/
      utils/
      app.js
      server.js
    sql/
      schema.sql
    .env.example
    package.json
  frontend/
    src/
      api/
      components/
      context/
      hooks/
      pages/
      App.jsx
      main.jsx
      styles.css
    .env.example
    index.html
    package.json
    vite.config.js
  README.md
```

## 6) Instructions de lancement

### Prerequis
- Node.js 18+
- Docker + Docker Compose

### Option recommandee - Full Docker (base + backend + frontend)
1. Depuis la racine du projet, lancer toute la stack:
  - `docker compose up -d --build`
2. Verifier l'etat des services:
  - `docker compose ps`
3. **Charger les données de test (optionnel)** - Pour commencer avec des comptes et données pré-configurés:
  - `docker compose exec -T postgres psql -U stageflow -d stageflow < backend/sql/seed-comprehensive.sql`
4. Ouvrir l'application:
  - Frontend: `http://localhost:8080`
  - Backend API: `http://localhost:5000`
  - PostgreSQL: `localhost:5432`

Le schema SQL est initialise automatiquement au premier demarrage via:
- `./backend/sql/schema.sql -> /docker-entrypoint-initdb.d/01-schema.sql`

Pour arreter:
- `docker compose down`

Pour reinitialiser completement la base (suppression des donnees):
- `docker compose down -v`

Le fichier `docker-compose.yml` contient:
- service `postgres` avec image officielle `postgres:16-alpine`
  - variables `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - volume persistant `postgres_data`
  - port expose `5432:5432`
  - init-script: `./backend/sql/schema.sql` chargé automatiquement
- service `backend` (Node.js 20 Alpine / Express)
  - dépend de postgres
  - envs chargées depuis `.env`
  - port expose `5000:5000`
  - hot-reload via volume mount
- service `frontend` (React + Vite + Nginx)
  - build optimisé Vite prod
  - port expose `8080:80`
  - dépend de backend

### Option alternative - Lancement local (sans Docker pour app)
1. Demarrer seulement la base:
  - `docker compose up -d postgres`
2. Backend local:
  - aller dans `backend`
  - `npm install`
  - copier `.env.example` vers `.env`
  - `npm run dev`
3. Frontend local:
  - aller dans `frontend`
  - `npm install`
  - copier `.env.example` vers `.env`
  - `npm run dev`

Frontend local: `http://localhost:5173`
Backend local: `http://localhost:5000`

## 7) Configuration - Variables d'environnement

### Backend (`.env`)
```
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=stageflow
DB_PASSWORD=stageflow_db_pass_123
DB_NAME=stageflow

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Email (optionnel pour dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@stageflow.com
APP_PUBLIC_URL=http://localhost:8080

# URL Frontend
FRONTEND_URL=http://localhost:8080
```

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=StageFlow
```

## 7.1) Bonnes pratiques deja integrees
- Validation requetes via Joi
- Gestion centralisee des erreurs
- Middleware auth + RBAC
- Etats de chargement et messages d'erreur UI
- Routes frontend protegees
- Client API axios centralise
- Logs structures JSON (info/error)
- Rate limiting sur auth et endpoints sensibles
- Notifications temps reel (WebSocket) + fallback polling frontend
- Upload CV securise (taille/type/token de telechargement)
- Migrations SQL versionnees + seeds de donnees
- Tests backend (auth, internships, applications)

## 7.2) Configuration email (verification + reset password)
- Configurer les variables backend suivantes dans `.env`:
  - `APP_PUBLIC_URL` (URL publique frontend, ex: `http://localhost:8081`)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- A l'inscription, un email de verification est envoye.
- En cas d'oubli de mot de passe, un email de reinitialisation est envoye.

## 8) Commandes backend utiles
- `npm run lint` : verifie la syntaxe backend et les regles qualite de base
- `npm run check` : execute le lint backend puis les tests
- `npm run migrate` : applique les migrations SQL (`backend/migrations`)
- `npm run seed` : injecte des donnees de test
- `npm run seed:demo` : injecte un jeu de donnees de demonstration complet (multi-roles, candidatures, projets, taches, messages, notifications, feedbacks)
- `npm test` : execute les tests backend

## 8.1) Commandes frontend utiles
- `npm run lint` : verifie les controles qualite frontend
- `npm run check` : execute le lint frontend puis le build de production
- `npm run build` : construit l'application frontend

## 9) Evolutions recommandees
- Rafraichissement token (refresh token)
- Logs structurés (pino/winston)
- Tests unitaires + integration (Jest/Vitest + Supertest)
- Pagination/recherche/filtres cote API
- Audit trail (historique des actions)
- Notifications (email/in-app) lors de validation des rapports
- Export PDF/Excel des rapports
--------------

