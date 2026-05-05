CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  department TEXT NOT NULL,
  country TEXT NOT NULL,
  salary REAL NOT NULL CHECK(salary >= 0),
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  email TEXT UNIQUE NOT NULL,
  hire_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employees_country ON employees(country);
CREATE INDEX IF NOT EXISTS idx_employees_job_title ON employees(job_title);
CREATE INDEX IF NOT EXISTS idx_employees_country_job ON employees(country, job_title);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
