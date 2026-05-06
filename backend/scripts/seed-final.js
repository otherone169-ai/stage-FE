import pool from "../src/config/db.js";
import bcrypt from "bcryptjs";

async function finalSeed() {
  try {
    console.log('🌱 Starting final seed...');
    
    // Create supervisor.demo@platform.local
    const supervisorPassword = await bcrypt.hash('Supervisor123!', 10);
    const supervisorResult = await pool.query(
      'INSERT INTO users (id, email, password_hash, role, is_active, is_email_verified) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING id',
      ['supervisor.demo@platform.local', supervisorPassword, 'supervisor', true, true]
    );
    
    const supervisorId = supervisorResult.rows[0].id;
    
    // Create company
    const companyResult = await pool.query(
      'INSERT INTO companies (id, user_id, name, description, location, website) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING id',
      [supervisorId, 'Alpha Tech', 'Product engineering, cloud infrastructure, and internal tooling', 'Casablanca', 'https://alpha.example.com']
    );
    
    const companyId = companyResult.rows[0].id;
    
    // Create supervisor profile
    await pool.query(
      'INSERT INTO supervisors (id, user_id, company_id, full_name, position) VALUES (gen_random_uuid(), $1, $2, $3, $4)',
      [supervisorId, companyId, 'Demo Supervisor', 'Project Manager']
    );
    
    console.log('✅ Supervisor demo created successfully');
    
    // Create 10 students
    const studentPassword = await bcrypt.hash('Student123!', 10);
    const studentData = [
      { email: 'student.one@platform.local', fullName: 'Amine Idrissi', education: 'Master Genie Logiciel', skills: 'react,node,postgresql,testing', experience: 'Projet e-commerce full-stack' },
      { email: 'student.two@platform.local', fullName: 'Salma Berrada', education: 'Licence Informatique', skills: 'python,sql,powerbi,excel', experience: 'Analyse de données académique' },
      { email: 'student.three@platform.local', fullName: 'Imane Trabelsi', education: 'Master Data Science', skills: 'python,ml,statistics,sql', experience: 'Mini-projets ML' },
      { email: 'student.four@platform.local', fullName: 'Karim Alaoui', education: 'Master Cloud & DevOps', skills: 'docker,kubernetes,linux,ci/cd', experience: 'Projet de déploiement cloud' },
      { email: 'student.five@platform.local', fullName: 'Omar El Kettani', education: 'Master en Cybersécurité', skills: 'python,security,networking,firewall', experience: 'Audit de sécurité réseau' },
      { email: 'student.six@platform.local', fullName: 'Fatima Zahra', education: 'Licence Marketing Digital', skills: 'seo,analytics,facebook-ads,google-ads', experience: 'Campagne marketing e-commerce' },
      { email: 'student.seven@platform.local', fullName: 'Yassine Amrani', education: 'Master UX/UI Design', skills: 'figma,sketch,adobe-xd,prototyping,css', experience: 'Design application mobile banking' },
      { email: 'student.eight@platform.local', fullName: 'Khadija Mansouri', education: 'Ingénieur en Télécommunications', skills: '5g,networking,voip,cisco,protocols', experience: 'Optimisation réseau 5G' },
      { email: 'student.nine@platform.local', fullName: 'Adam Benjelloun', education: 'Master Intelligence Artificielle', skills: 'tensorflow,pytorch,nlp,computer-vision,python', experience: 'Modèle de reconnaissance d\'images' },
      { email: 'student.ten@platform.local', fullName: 'Mariam El Idrissi', education: 'Master Business Intelligence', skills: 'tableau,powerbi,sql,data-warehousing,etl', experience: 'Création dashboard KPIs' }
    ];
    
    const studentIds = [];
    for (let i = 0; i < studentData.length; i++) {
      const student = studentData[i];
      const studentResult = await pool.query(
        'INSERT INTO users (id, email, password_hash, role, is_active, is_email_verified) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING id',
        [student.email, studentPassword, 'student', true, true]
      );
      
      const studentId = studentResult.rows[0].id;
      
      await pool.query(
        'INSERT INTO students (id, user_id, full_name, phone, education, skills, experience, cv_url, profile_completed) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true)',
        [studentId, student.fullName, '061100000' + (i + 1), student.education, student.skills, student.experience, '/uploads/demo-cv.pdf']
      );
      
      studentIds.push(studentId);
      console.log(`✅ Student ${i + 1} created: ${student.fullName}`);
    }
    
    console.log('✅ All students created successfully');
    
    // Create an internship first
    const internshipResult = await pool.query(
      'INSERT INTO internships (id, company_id, title, description, moderation_status, is_active) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING id',
      [companyId, 'Demo Internship', 'Internship for demo purposes', 'approved', true]
    );
    
    const internshipId = internshipResult.rows[0].id;
    console.log('✅ Internship created successfully');
    
    // Create projects for demo supervisor
    const projectData = [
      { title: 'Application de Gestion de Stage', description: 'Développer une application web complète pour la gestion des stages', objectives: 'Créer une plateforme avec authentification, dashboard, et système de notifications' },
      { title: 'Mobile Banking App', description: 'Contribuer au développement d\'application mobile bancaire', objectives: 'Développer les fonctionnalités de transfert d\'argent et consultation de solde' }
    ];
    
    const projectIds = [];
    for (let i = 0; i < projectData.length; i++) {
      const project = projectData[i];
      const projectResult = await pool.query(
        'INSERT INTO projects (id, internship_id, supervisor_id, title, description, objectives) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING id',
        [internshipId, supervisorId, project.title, project.description, project.objectives]
      );
      
      projectIds.push(projectResult.rows[0].id);
      console.log(`✅ Project ${i + 1} created: ${project.title}`);
    }
    
    console.log('✅ All projects created successfully');
    
    // Assign some students to projects
    await pool.query(
      'INSERT INTO interns (id, student_id, project_id, supervisor_id, status, start_date) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, CURRENT_DATE)',
      [studentIds[4], projectIds[0], supervisorId, 'active']
    );
    
    await pool.query(
      'INSERT INTO interns (id, student_id, project_id, supervisor_id, status, start_date) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, CURRENT_DATE)',
      [studentIds[5], projectIds[1], supervisorId, 'active']
    );
    
    console.log('✅ Students assigned to projects successfully');
    
    console.log('✅ Demo data seeded successfully!');
    console.log('📧 Login credentials:');
    console.log('   Supervisor: supervisor.demo@platform.local / Supervisor123!');
    console.log('   Students: student.one@platform.local to student.ten@platform.local / Student123!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

finalSeed();
