# Rapport de Cohérence Schéma SQL vs Backend vs Frontend

## 📋 Résumé des Incohérences Identifiées

### 🔴 **Incohérences Critiques - Tables Manquantes dans le Schéma**

#### **1. Table `companies`**
- **Présente dans**: Backend (28 références)
- **Absente dans**: Schéma SQL
- **Impact**: Erreurs lors de l'inscription superviseur et dashboard admin

#### **2. Table `internships`** 
- **Présente dans**: Backend (64 références)
- **Absente dans**: Schéma SQL  
- **Impact**: Fonctionnalités de stage non fonctionnelles

#### **3. Table `applications`**
- **Présente dans**: Backend (31 références)
- **Absente dans**: Schéma SQL
- **Impact**: Gestion des candidatures cassée

### 🟡 **Incohérences Structurelles**

#### **4. Modèle Superviseur**
- **Schéma SQL**: Informations entreprise directement dans `supervisors`
- **Backend**: Référence `company_id` vers table `companies`
- **Statut**: Partiellement corrigé dans authController.js

#### **5. Modèle de Données**
- **Schéma SQL**: Modèle simplifié (users → students/supervisors → projects → interns)
- **Backend**: Modèle complexe (users → students/supervisors → companies → internships → projects → interns → applications)

---

## 🗄️ **Tables du Schéma SQL**

```sql
✅ users (id, email, password_hash, role, is_active, is_email_verified, created_at)
✅ students (id, user_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed, created_at, updated_at)
✅ supervisors (id, user_id, full_name, position, company_name, company_description, company_location, company_website, created_at, updated_at)
✅ projects (id, supervisor_id, title, description, objectives, location, duration, domain, requirements, created_at, updated_at)
✅ interns (id, student_id, project_id, supervisor_id, status, start_date, end_date, created_at)
✅ tasks (id, project_id, title, description, deadline, status, created_at, updated_at)
✅ tasks_updates (id, task_id, intern_id, progress, status, file_url, updated_at)
✅ feedbacks (id, supervisor_id, intern_id, comment, rating, created_at)
✅ documents (id, user_id, type, file_url, uploaded_at)
✅ notifications (id, user_id, type, message, is_read, created_at)
✅ messages (id, sender_id, receiver_id, content, sent_at)
✅ audit_logs (id, user_id, action, metadata, created_at)
✅ password_reset_tokens (id, user_id, token_hash, expires_at, used_at)
✅ email_verification_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
✅ task_remarks (id, task_id, user_id, content, created_at, updated_at)
✅ reports (id, intern_id, student_id, supervisor_id, title, content, status, feedback, submitted_at, validated_at, created_at, updated_at)
```

## 🔧 **Tables Attendues par le Backend (Manquantes)**

```sql
❌ companies (id, user_id, name, description, location, website, created_at, updated_at)
❌ internships (id, company_id, supervisor_id, title, description, location, domain, start_date, end_date, duration_weeks, moderation_status, is_active, created_at, updated_at)
❌ applications (id, student_id, internship_id, status, cover_letter, applied_at, updated_at)
```

---

## 🌐 **Impact sur le Frontend**

### **Pages Affectées**
- ❌ **RegisterPage**: Utilise `company_id` dans l'inscription superviseur
- ❌ **DashboardPage**: Fait référence aux `internships` et `applications`
- ❌ **AdminPages**: Gèrent les `companies` et `internships`
- ❌ **SupervisorPages**: Créent et gèrent les `internships`

### **API Calls qui vont échouer**
- `/api/companies/*` - Table non existante
- `/api/internships/*` - Table non existante  
- `/api/applications/*` - Table non existante
- `/api/dashboard/stats` - Jointures sur tables manquantes

---

## 🚨 **Erreurs Actuelles**

### **1. Inscription Superviseur**
```sql
-- Backend essaie:
INSERT INTO supervisors (user_id, company_id, full_name, position)
-- Schéma attend:
INSERT INTO supervisors (user_id, full_name, position, company_name, company_description, company_location, company_website)
```

### **2. Dashboard Stats**
```sql
-- Backend essaie des jointures sur:
companies, internships, applications
-- Tables inexistantes → erreurs SQL
```

### **3. Projets vs Internships**
- **Schéma**: `projects.supervisor_id` → `supervisors.id`
- **Backend**: `projects.supervisor_id` + `projects.internship_id`
- **Conflit**: Colonne `internship_id` manquante

---

## 📊 **Analyse d'Impact**

| Composant | Statut | Impact | Correction Requise |
|-----------|--------|--------|-------------------|
| **Authentification** | ⚠️ Partiel | Inscription superviseur cassée | ✅ Corrigée partiellement |
| **Dashboard** | ❌ Critique | Stats et données erronées | 🔨 Réécriture requise |
| **Admin** | ❌ Critique | Gestion entreprises/ stages cassée | 🔨 Réécriture requise |
| **Supervisor** | ❌ Critique | Création stages cassée | 🔨 Réécriture requise |
| **Student** | ⚠️ Partiel | Visualisation limitée | 🔨 Adaptation requise |

---

## 🔄 **Options de Correction**

### **Option 1: Adapter le Backend au Schéma (Recommandé)**
- ✅ **Avantages**: Schéma simplifié, plus maintenable
- ✅ **Travail**: Réécrire les contrôleurs pour utiliser `projects` au lieu de `internships`
- ✅ **Impact**: Frontend à adapter légèrement

### **Option 2: Étendre le Schéma SQL**
- ❌ **Inconvénients**: Complexité accrue, plus de tables
- ⚠️ **Travail**: Ajouter `companies`, `internships`, `applications`
- ❌ **Impact**: Migration de données complexe

---

## 🎯 **Recommandation**

**Adopter l'Option 1**: Simplifier le backend pour correspondre au schéma SQL existant.

### **Étapes requises**:
1. ✅ **Corriger l'inscription superviseur** (déjà fait)
2. 🔨 **Réécrire les contrôleurs internship → project**
3. 🔨 **Adapter les dashboard stats**
4. 🔨 **Mettre à jour le frontend**
5. ✅ **Tester l'application**

---

## 📈 **Prochaines Étapes**

1. **Analyser le frontend** pour identifier les dépendances aux tables manquantes
2. **Réécrire les contrôleurs** pour utiliser le modèle simplifié
3. **Adapter les composants frontend** au nouveau modèle
4. **Tester toutes les fonctionnalités** après corrections
5. **Mettre à jour la documentation** avec le modèle de données final

---

*Rapport généré le 4 mai 2026 - Analyse de cohérence Schéma/Backend/Frontend*
