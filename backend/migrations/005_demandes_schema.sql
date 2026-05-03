-- Migration 005: Add schema for Demandes 3-6 (internship workflow, CV parsing, acceptance, weekly follow-ups)

-- Add new columns to internships table for supervisor and dates
ALTER TABLE internships ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES supervisors(id) ON DELETE SET NULL;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;

-- Add CV-related columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS cv_parsed_data JSONB DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS cv_file_url TEXT DEFAULT NULL;

-- Add acceptance workflow tracking to interns table
ALTER TABLE interns ADD COLUMN IF NOT EXISTS acceptance_status VARCHAR(30) DEFAULT 'pending' CHECK (acceptance_status IN ('pending', 'accepted', 'confirmed', 'rejected'));
ALTER TABLE interns ADD COLUMN IF NOT EXISTS acceptance_date TIMESTAMP DEFAULT NULL;
ALTER TABLE interns ADD COLUMN IF NOT EXISTS confirmation_date TIMESTAMP DEFAULT NULL;
ALTER TABLE interns ADD COLUMN IF NOT EXISTS project_assigned_at TIMESTAMP DEFAULT NULL;

-- Create table for weekly follow-ups
CREATE TABLE IF NOT EXISTS weekly_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES interns(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  commit_hash VARCHAR(255),
  tasks_summary TEXT,
  challenges TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(intern_id, week_number)
);

-- Create table for acceptance workflow tracking
CREATE TABLE IF NOT EXISTS acceptance_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'confirmed', 'rejected')),
  project_title VARCHAR(180),
  supervisor_message TEXT,
  email_sent_at TIMESTAMP DEFAULT NULL,
  student_confirmed_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create table for dashboard statistics cache (refreshed periodically)
CREATE TABLE IF NOT EXISTS dashboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID REFERENCES supervisors(id) ON DELETE CASCADE,
  total_students INTEGER DEFAULT 0,
  pending_students INTEGER DEFAULT 0,
  accepted_students INTEGER DEFAULT 0,
  active_projects INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  projects_data JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_internships_supervisor_id ON internships(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_interns_acceptance_status ON interns(acceptance_status);
CREATE INDEX IF NOT EXISTS idx_weekly_follow_ups_intern_id ON weekly_follow_ups(intern_id);
CREATE INDEX IF NOT EXISTS idx_acceptance_workflows_supervisor_id ON acceptance_workflows(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_acceptance_workflows_student_id ON acceptance_workflows(student_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_supervisor_id ON dashboard_stats(supervisor_id);
