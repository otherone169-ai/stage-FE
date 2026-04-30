-- Comprehensive seed data aligned with platform workflows
-- Requires schema.sql already applied

INSERT INTO users (id, email, password_hash, role, is_active, is_email_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@stageflow.com', crypt('AdminPassword123', gen_salt('bf')), 'admin', true, true),
('00000000-0000-0000-0000-000000000101', 'rh.alpha@company.com', crypt('CompanyPass123', gen_salt('bf')), 'company', true, true),
('00000000-0000-0000-0000-000000000102', 'rh.beta@company.com', crypt('CompanyPass123', gen_salt('bf')), 'company', true, true),
('00000000-0000-0000-0000-000000000201', 'sup.alpha.1@stageflow.com', crypt('SupervisorPass123', gen_salt('bf')), 'supervisor', true, true),
('00000000-0000-0000-0000-000000000202', 'sup.alpha.2@stageflow.com', crypt('SupervisorPass123', gen_salt('bf')), 'supervisor', true, true),
('00000000-0000-0000-0000-000000000203', 'sup.beta.1@stageflow.com', crypt('SupervisorPass123', gen_salt('bf')), 'supervisor', true, true),
('00000000-0000-0000-0000-000000000204', 'sup.beta.2@stageflow.com', crypt('SupervisorPass123', gen_salt('bf')), 'supervisor', true, true),
('00000000-0000-0000-0000-000000000301', 'student1@univ.edu', crypt('StudentPass123', gen_salt('bf')), 'student', true, true),
('00000000-0000-0000-0000-000000000302', 'student2@univ.edu', crypt('StudentPass123', gen_salt('bf')), 'student', true, true),
('00000000-0000-0000-0000-000000000303', 'student3@univ.edu', crypt('StudentPass123', gen_salt('bf')), 'student', true, true),
('00000000-0000-0000-0000-000000000304', 'student4@univ.edu', crypt('StudentPass123', gen_salt('bf')), 'student', true, true),
('00000000-0000-0000-0000-000000000305', 'student5@univ.edu', crypt('StudentPass123', gen_salt('bf')), 'student', true, true),
('00000000-0000-0000-0000-000000000306', 'student6@univ.edu', crypt('StudentPass123', gen_salt('bf')), 'student', true, true);

INSERT INTO companies (id, user_id, name, description, location, website) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Alpha Tech', 'Product engineering, cloud infrastructure, and internal tooling', 'Paris', 'https://alpha.example.com'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102', 'Beta Dynamics', 'AI experimentation, analytics, and platform operations', 'Lyon', 'https://beta.example.com');

INSERT INTO supervisors (id, user_id, company_id, full_name, position) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000001', 'Amine Rahali', 'Engineering Manager'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000001', 'Sara Belaid', 'Senior Frontend Lead'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000002', 'Nour Benali', 'Data Science Lead'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000002', 'Rami Gharbi', 'Platform Reliability Lead');

INSERT INTO students (id, user_id, full_name, phone, education, skills, experience, profile_completed) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000301', 'Lina Trabelsi', '+21620000001', 'Master CS', 'React,Node.js,PostgreSQL', 'University projects', true),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000302', 'Youssef Mahjoub', '+21620000002', 'Master Software Engineering', 'Java,Spring,SQL', 'Internship in QA', true),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000303', 'Rim Saidi', '+21620000003', 'Master Data Science', 'Python,Pandas,ML', 'Data analysis projects', true),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000304', 'Hedi Khemiri', '+21620000004', 'Master CS', 'TypeScript,React,UI', 'Freelance web apps', true),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000305', 'Meriem Ben Amor', '+21620000005', 'Master AI', 'Python,FastAPI,TensorFlow', 'Research assistant', true),
('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000306', 'Walid Jlassi', '+21620000006', 'Master Systems', 'Docker,Kubernetes,CI/CD', 'DevOps trainee', true);

INSERT INTO internships (id, company_id, title, description, location, duration, domain, requirements, required_skills, moderation_status, is_active) VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Fullstack Platform Intern', 'Build internal product features and release flows', 'Paris', '6 months', 'Web', 'Good JS skills', 'React,Node.js,PostgreSQL', 'approved', true),
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Frontend Design System Intern', 'Improve UI patterns, accessibility, and component library', 'Paris', '4 months', 'Frontend', 'React required', 'React,TypeScript,CSS', 'approved', true),
('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Data Science Intern', 'Build analytics pipelines and executive dashboards', 'Lyon', '6 months', 'Data', 'Python required', 'Python,Pandas,ML', 'approved', true),
('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Platform Reliability Intern', 'Automate deployments and observability checks', 'Lyon', '5 months', 'DevOps', 'Container tooling', 'Docker,Kubernetes,CI/CD', 'approved', true),
('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'AI Research Intern', 'Prototype recommendation experiments and data labeling workflows', 'Lyon', '3 months', 'AI', 'Python and curiosity', 'Python,ML,SQL', 'pending', false);

INSERT INTO applications (id, student_id, internship_id, status) VALUES
('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'accepted'),
('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'pending'),
('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 'accepted'),
('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', 'rejected'),
('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', 'pending'),
('50000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000004', 'accepted'),
('50000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 'pending');

INSERT INTO projects (id, internship_id, supervisor_id, title, description, objectives) VALUES
('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Portal Delivery', 'Deliver MVP of the internal portal', 'MVP, test plan, and release checklist'),
('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Analytics Suite', 'Build KPI dashboards for leadership', 'ETL, BI reports, and insights'),
('60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'Deployment Automation', 'CI/CD and observability setup', 'Reliable delivery pipeline');

INSERT INTO interns (id, student_id, project_id, supervisor_id, status, start_date, end_date) VALUES
('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'active', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '120 days'),
('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'active', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '150 days'),
('70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', 'paused', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '145 days');

INSERT INTO tasks (id, project_id, title, description, deadline, status) VALUES
('80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Set up frontend shell', 'Create app shell, navigation, and layout primitives', CURRENT_DATE + INTERVAL '7 days', 'todo'),
('80000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'Implement auth pages', 'Login, register, reset, and verification views', CURRENT_DATE + INTERVAL '10 days', 'in_progress'),
('80000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', 'Integrate dashboard', 'Connect role-aware dashboard API and render metrics', CURRENT_DATE + INTERVAL '14 days', 'done'),
('80000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000002', 'Prepare ETL notebook', 'Collect and clean source data for analysis', CURRENT_DATE + INTERVAL '8 days', 'in_progress'),
('80000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000002', 'KPI visualization', 'Build charts and trend summaries', CURRENT_DATE + INTERVAL '12 days', 'todo'),
('80000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000003', 'Setup CI pipeline', 'Automate tests, build, and deployment', CURRENT_DATE + INTERVAL '9 days', 'done');

INSERT INTO task_updates (task_id, intern_id, progress, status, file_url) VALUES
('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'Auth pages are 60% complete with validation hooks in place', 'in_progress', null),
('80000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000002', 'ETL prep complete, waiting data review', 'done', null);

INSERT INTO task_remarks (task_id, user_id, content) VALUES
('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000301', 'Reset flow UI is done and validation messages are wired.'),
('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000201', 'Good progress. Add tests for the edge cases before merge.'),
('80000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000203', 'Please include null handling and a fallback chart state.');

INSERT INTO feedbacks (supervisor_id, intern_id, comment, rating) VALUES
('20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'Strong communication and reliable execution so far.', 4.40),
('20000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', 'Very good analytical thinking and clean delivery.', 4.80);

INSERT INTO reports (id, intern_id, student_id, supervisor_id, title, content, status, submitted_at) VALUES
('90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Sprint 1 Report', 'Completed routing and auth pages. Next: tests and deployment.', 'submitted', NOW() - INTERVAL '1 day'),
('90000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Analytics Draft', 'Finished dataset cleanup and chart prototypes.', 'draft', null);

INSERT INTO notifications (user_id, type, message, is_read) VALUES
('00000000-0000-0000-0000-000000000301', 'application', 'Votre candidature a ete acceptee pour le stage Fullstack Platform Intern.', false),
('00000000-0000-0000-0000-000000000201', 'report', 'Un rapport Sprint 1 est en attente de validation.', false),
('00000000-0000-0000-0000-000000000101', 'assignment', 'Un superviseur a ete assigne au stage Data Analytics.', true);

INSERT INTO messages (sender_id, receiver_id, content) VALUES
('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'Bonjour, peut-on revoir les objectifs du sprint et les livrables ?'),
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000301', 'Oui, on fait un point cet apres-midi pour cadrer tout ça.');
