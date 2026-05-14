-- Remove internship-centric model: projects belong directly to supervisors.
-- Drops applications and matches (internship-based). Drops internships table.

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_internship_id_fkey;

ALTER TABLE projects DROP COLUMN IF EXISTS internship_id;

DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS internships CASCADE;

UPDATE projects p
SET supervisor_id = (
  SELECT i.supervisor_id FROM interns i WHERE i.project_id = p.id LIMIT 1
)
WHERE p.supervisor_id IS NULL;

DELETE FROM projects WHERE supervisor_id IS NULL;

ALTER TABLE projects ALTER COLUMN supervisor_id SET NOT NULL;
