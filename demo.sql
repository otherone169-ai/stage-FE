-- ===========================================
-- 🎭 DÉMONSTRATION COMPLÈTE - StageFlow
-- ===========================================
-- 1 Admin + 1 Superviseur + 2 Stagiaires
-- 2 Projets avec tâches complètes
-- Assignation des stagiaires aux projets
-- ===========================================

-- 1️⃣ CRÉATION DES UTILISATEURS
INSERT INTO users (id, email, password_hash, role, is_active, is_email_verified) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'admin.demo@platform.local', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'supervisor.demo@platform.local', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'etudiant1.demo@platform.local', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'etudiant2.demo@platform.local', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', true, true);

-- 2️⃣ CRÉATION DES PROFILS
-- Entreprise du superviseur
INSERT INTO companies (id, user_id, name, description, location, website) VALUES 
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'TechCorp Solutions', 'Entreprise spécialisée dans le développement de solutions logicielles innovantes', 'Paris, France', 'https://techcorp.example.com');

-- Profil du superviseur
INSERT INTO supervisors (id, user_id, company_id, full_name, position) VALUES 
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Marie Superviseur', 'Développeuse Senior');

-- Profils des stagiaires
INSERT INTO students (id, user_id, full_name, phone, education, skills, experience, profile_completed) VALUES 
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Jean Etudiant', '+33612345678', 'Université de Paris - Master Informatique', 'JavaScript, React, Node.js, PostgreSQL, Git', 'Stage de développement web full-stack (6 mois)', true),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Sophie Etudiante', '+33698765432', 'École Polytechnique - Ingénierie Logicielle', 'Python, Django, React, Docker, AWS, Machine Learning', 'Stage en développement backend et DevOps (4 mois)', true);

-- 3️⃣ CRÉATION DES PROJETS
-- Projet 1: Application Web de Gestion
INSERT INTO projects (id, supervisor_id, title, description, objectives, location, duration, domain, requirements) VALUES 
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Application Web de Gestion', 'Développement complet d''une application web de gestion des stages avec interface moderne et API RESTful', 'Créer une application web complète avec frontend React, backend Node.js, et base de données PostgreSQL. L''application doit permettre la gestion des stagiaires, des projets, et du suivi des tâches.', 'Remote', '4 mois', 'Développement Web Full-Stack', 'React, Node.js, Express, PostgreSQL, Git, REST APIs, Responsive Design');

-- Projet 2: Système de Notifications
INSERT INTO projects (id, supervisor_id, title, description, objectives, location, duration, domain, requirements) VALUES 
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Système de Notifications en Temps Réel', 'Implémentation d''un système de notifications temps réel avec WebSocket et microservices', 'Développer une architecture de notifications scalable avec WebSocket, Redis, et service de queue. Le système doit supporter les notifications push, emails, et SMS.', 'Hybride (2 jours bureau/3 jours remote)', '3 mois', 'Backend & Infrastructure', 'Node.js, Socket.io, Redis, Docker, Kubernetes, AWS SQS, Microservices');

-- 4️⃣ CRÉATION DES TÂCHES
-- Tâches du Projet 1: Application Web
INSERT INTO tasks (id, project_id, title, description, deadline, status) VALUES 
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', 'Configuration de l''environnement de développement', 'Mettre en place l''environnement complet : Node.js, React, PostgreSQL, Docker. Configurer les outils de développement et les scripts de build.', '2024-02-01', 'todo'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', 'Conception et création de la base de données', 'Définir le schéma relationnel complet, créer les tables, les index, et les contraintes. Préparer les données de test.', '2024-02-15', 'todo'),
('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440005', 'Développement de l''API REST', 'Implémenter tous les endpoints REST pour la gestion des utilisateurs, projets, et tâches. Ajouter l''authentification JWT et la validation.', '2024-03-01', 'todo'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', 'Développement de l''interface React', 'Créer l''interface utilisateur complète avec routing, formulaires, tableaux, et dashboard. Intégrer l''API et gérer les états.', '2024-03-20', 'todo'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440005', 'Tests et déploiement', 'Écrire les tests unitaires et d''intégration. Configurer CI/CD et déployer l''application en production.', '2024-04-01', 'todo');

-- Tâches du Projet 2: Système de Notifications
INSERT INTO tasks (id, project_id, title, description, deadline, status) VALUES 
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440006', 'Design de l''architecture microservices', 'Concevoir l''architecture complète avec les services, les APIs, et les flux de données. Créer les diagrammes et documentation.', '2024-02-10', 'todo'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440006', 'Implémentation WebSocket', 'Développer le service WebSocket avec Socket.io pour les notifications temps réel. Gérer les connexions et la scalabilité.', '2024-02-25', 'todo'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440006', 'Service de queue de messages', 'Implémenter le service de queue avec Redis et Bull Queue. Gérer les priorités, retries, et dead letters.', '2024-03-10', 'todo'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440006', 'Intégration Email & SMS', 'Connecter les services externes d''envoi d''emails et SMS. Créer les templates et gérer les envois en masse.', '2024-03-25', 'todo'),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440006', 'Monitoring et métriques', 'Ajouter le monitoring, les logs, et les métriques. Créer les dashboards et les alertes.', '2024-04-05', 'todo');

-- 5️⃣ ASSIGNATION DES STAGIAIRES AUX PROJETS
-- Jean étudiant sur le projet Application Web
INSERT INTO interns (id, student_id, project_id, supervisor_id, status, start_date, end_date) VALUES 
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'active', '2024-01-15', '2024-05-15');

-- Sophie étudiante sur le projet Notifications
INSERT INTO interns (id, student_id, project_id, supervisor_id, status, start_date, end_date) VALUES 
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'active', '2024-01-20', '2024-04-20');

-- 6️⃣ CRÉATION DE NOTIFICATIONS
INSERT INTO notifications (user_id, type, message, is_read) VALUES 
('550e8400-e29b-41d4-a716-446655440003', 'project_assignment', 'Vous avez été assigné au projet: "Application Web de Gestion"

Description: Développement complet d''une application web de gestion des stages avec interface moderne et API RESTful

Tâches à accomplir:
1. Configuration de l''environnement de développement
2. Conception et création de la base de données
3. Développement de l''API REST
4. Développement de l''interface React
5. Tests et déploiement', false),
('550e8400-e29b-41d4-a716-446655440004', 'project_assignment', 'Vous avez été assigné au projet: "Système de Notifications en Temps Réel"

Description: Implémentation d''un système de notifications temps réel avec WebSocket et microservices

Tâches à accomplir:
1. Design de l''architecture microservices
2. Implémentation WebSocket
3. Service de queue de messages
4. Intégration Email & SMS
5. Monitoring et métriques', false);

-- 7️⃣ CRÉATION DE RAPPORTS D''AUDIT
INSERT INTO audit_logs (user_id, action, metadata) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 'project_created', '{"projectId": "proj-001-web-gestion", "projectTitle": "Application Web de Gestion"}'),
('550e8400-e29b-41d4-a716-446655440002', 'project_created', '{"projectId": "proj-002-notifications", "projectTitle": "Système de Notifications en Temps Réel"}'),
('550e8400-e29b-41d4-a716-446655440002', 'student_assigned_to_project', '{"projectId": "proj-001-web-gestion", "studentId": "550e8400-e29b-41d4-a716-446655440003", "studentEmail": "etudiant1.demo@platform.local"}'),
('550e8400-e29b-41d4-a716-446655440002', 'student_assigned_to_project', '{"projectId": "proj-002-notifications", "studentId": "550e8400-e29b-41d4-a716-446655440004", "studentEmail": "etudiant2.demo@platform.local"}');

-- ===========================================
-- 🎯 RÉSUMÉ DE LA DÉMONSTRATION
-- ===========================================
-- 👥 UTILISATEURS CRÉÉS:
--    • Admin: admin.demo@platform.local / password
--    • Superviseur: supervisor.demo@platform.local / password  
--    • Étudiant 1: etudiant1.demo@platform.local / password
--    • Étudiant 2: etudiant2.demo@platform.local / password
--
-- 🏗️ PROJETS CRÉÉS:
--    • Application Web de Gestion (5 tâches)
--    • Système de Notifications (5 tâches)
--
-- 👤 ASSIGNATIONS:
--    • Jean → Application Web de Gestion
--    • Sophie → Système de Notifications
--
-- 📊 STATISTIQUES:
--    • 4 utilisateurs actifs
--    • 2 superviseurs (1 admin + 1 superviseur)
--    • 2 stagiaires actifs
--    • 2 projets en cours
--    • 10 tâches au total
--    • 2 notifications envoyées
-- ===========================================
