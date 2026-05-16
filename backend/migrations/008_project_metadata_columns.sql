-- Align legacy projects table with supervisor-owned project model (schema.sql).

ALTER TABLE projects ADD COLUMN IF NOT EXISTS location VARCHAR(140);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration VARCHAR(80);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain VARCHAR(120);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
