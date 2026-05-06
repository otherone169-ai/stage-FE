import pool from "../src/config/db.js";

async function simpleSeed() {
  try {
    console.log('Starting simple seed...');
    
    // Get company ID first
    const companyResult = await pool.query('SELECT id FROM companies WHERE name = $1 LIMIT 1', ['Alpha Tech']);
    const companyId = companyResult.rows[0].id;
    
    // Create supervisor.demo@platform.local
    const supervisorResult = await pool.query(
      'INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, is_active = EXCLUDED.is_active RETURNING id',
      ['supervisor.demo@platform.local', 'supervisor123', 'supervisor', true]
    );
    
    const supervisorId = supervisorResult.rows[0].id;
    
    // Create supervisor profile
    await pool.query(
      'INSERT INTO supervisors (user_id, company_id, full_name, position) VALUES ($1, $2, $3, $4) RETURNING id',
      [supervisorId, companyId, 'Demo Supervisor', 'Project Manager']
    );
    
    console.log('✅ Supervisor demo created successfully');
    
    // Create 10 students
    const studentData = [
      ['student.one@platform.local', 'Student123', 'student', true, 'Amine Idrissi', 'Master Genie Logiciel', 'react,node,postgresql,testing', 'Projet e-commerce full-stack'],
      ['student.two@platform.local', 'Student123', 'student', true, 'Salma Berrada', 'Licence Informatique', 'python,sql,powerbi,excel'],
      ['student.three@platform.local', 'Student123', 'student', true, 'Imane Trabelsi', 'Master Data Science', 'python,ml,statistics,sql'],
      ['student.four@platform.local', 'Student123', 'student', true, 'Karim Alaoui', 'Master Cloud & DevOps', 'docker,kubernetes,linux,ci/cd'],
      ['student.five@platform.local', 'Student123', 'student', true, 'Omar El Kettani', 'Master en Cybersécurité', 'python,security,networking,firewall'],
      ['student.six@platform.local', 'Student123', 'student', true, 'Fatima Zahra', 'Licence Marketing Digital', 'seo,analytics,facebook-ads,google-ads'],
      ['student.seven@platform.local', 'Student123', 'student', true, 'Yassine Amrani', 'Master UX/UI Design', 'figma,sketch,adobe-xd,prototyping,css'],
      ['student.eight@platform.local', 'Student123', 'student', true, 'Khadija Mansouri', 'Ingénieur en Télécommunications', '5g,networking,voip,cisco,protocols'],
      ['student.nine@platform.local', 'Student123', 'student', true, 'Adam Benjelloun', 'Master Intelligence Artificielle', 'tensorflow,pytorch,nlp,computer-vision,python'],
      ['student.ten@platform.local', 'Student123', 'student', true, 'Mariam El Idrissi', 'Master Business Intelligence', 'tableau,powerbi,sql,data-warehousing,etl']
    ];
    
    for (let i = 0; i < studentData.length; i++) {
      const [email, password, role, isActive, fullName, education, skills] = studentData[i];
      const studentResult = await pool.query(
        'INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, is_active = EXCLUDED.is_active RETURNING id',
        [email, password, role, isActive]
      );
      
      const studentId = studentResult.rows[0].id;
      
      await pool.query(
        'INSERT INTO students (user_id, full_name, phone, education, skills, cv_url, profile_completed) VALUES ($1, $2, $3, $4, $5, $6, true)',
        [studentId, fullName, '061100000' + (i + 1), education, skills, '/uploads/demo-cv.pdf']
      );
      
      console.log(`✅ Student ${i + 1} created: ${fullName}`);
    }
    
    console.log('✅ All students created successfully');
    
    // Create projects for demo supervisor
    const projectData = [
      ['Application de Gestion de Stage', 'Développer une application web complète pour la gestion des stages', 'Créer une plateforme avec authentification, dashboard, et système de notifications', 'Casablanca', '6 mois', 'Web Development', 'React, Node.js, PostgreSQL, Git'],
      ['Mobile Banking App', 'Contribuer au développement d\'application mobile bancaire', 'Développer les fonctionnalités de transfert d\'argent et consultation de solde', 'Remote', '4 mois', 'Mobile Development', 'React Native, TypeScript, REST APIs']
    ];
    
    for (let i = 0; i < projectData.length; i++) {
      const [title, description, objectives, location, duration, domain, requirements] = projectData[i];
      const projectResult = await pool.query(
        'INSERT INTO projects (supervisor_id, title, description, objectives, location, duration, domain, requirements) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [supervisorId, title, description, objectives, location, duration, domain, requirements]
      );
      console.log(`✅ Project ${i + 1} created: ${title}`);
    }
    
    console.log('✅ All projects created successfully');
    
    // Assign some students to projects
    await pool.query(
      'INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date) VALUES ($1, $2, $3, $4, CURRENT_DATE)',
      [5, 1, supervisorId, 'active']
    );
    
    await pool.query(
      'INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date) VALUES ($1, $2, $3, $4, CURRENT_DATE)',
      [6, 2, supervisorId, 'active']
    );
    
    console.log('✅ Students assigned to projects successfully');
    
    console.log('✅ Demo data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

simpleSeed();
