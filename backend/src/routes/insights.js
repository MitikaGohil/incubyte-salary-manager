import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { getDb } from '../db/database.js';

const router = Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/insights/salary-by-country
router.get('/salary-by-country', (req, res) => {
  try {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT
          country,
          COUNT(*) as employee_count,
          ROUND(MIN(salary), 2) as min_salary,
          ROUND(MAX(salary), 2) as max_salary,
          ROUND(AVG(salary), 2) as avg_salary
        FROM employees
        GROUP BY country
        ORDER BY avg_salary DESC
      `)
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/salary-by-job-country?country=X
router.get(
  '/salary-by-job-country',
  [query('country').optional().trim()],
  handleValidation,
  (req, res) => {
    try {
      const db = getDb();
      const { country } = req.query;
      const where = country ? 'WHERE country = ?' : '';
      const params = country ? [country] : [];

      const rows = db
        .prepare(`
          SELECT
            job_title,
            country,
            COUNT(*) as employee_count,
            ROUND(MIN(salary), 2) as min_salary,
            ROUND(MAX(salary), 2) as max_salary,
            ROUND(AVG(salary), 2) as avg_salary
          FROM employees
          ${where}
          GROUP BY job_title, country
          ORDER BY country, avg_salary DESC
        `)
        .all(...params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/insights/salary-by-department
router.get('/salary-by-department', (req, res) => {
  try {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT
          department,
          COUNT(*) as employee_count,
          ROUND(MIN(salary), 2) as min_salary,
          ROUND(MAX(salary), 2) as max_salary,
          ROUND(AVG(salary), 2) as avg_salary
        FROM employees
        GROUP BY department
        ORDER BY avg_salary DESC
      `)
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/headcount-by-country
router.get('/headcount-by-country', (req, res) => {
  try {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT country, COUNT(*) as count
        FROM employees
        GROUP BY country
        ORDER BY count DESC
      `)
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/employment-type-breakdown
router.get('/employment-type-breakdown', (req, res) => {
  try {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT employment_type, COUNT(*) as count
        FROM employees
        GROUP BY employment_type
        ORDER BY count DESC
      `)
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/top-paid?limit=10&country=X
router.get(
  '/top-paid',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('country').optional().trim(),
  ],
  handleValidation,
  (req, res) => {
    try {
      const db = getDb();
      const limit = req.query.limit || 10;
      const { country } = req.query;
      const where = country ? 'WHERE country = ?' : '';
      const params = country ? [country, limit] : [limit];

      const rows = db
        .prepare(
          `SELECT id, full_name, job_title, department, country, salary
           FROM employees ${where}
           ORDER BY salary DESC LIMIT ?`
        )
        .all(...params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/insights/summary
router.get('/summary', (req, res) => {
  try {
    const db = getDb();
    const summary = db
      .prepare(`
        SELECT
          COUNT(*) as total_employees,
          ROUND(MIN(salary), 2) as global_min,
          ROUND(MAX(salary), 2) as global_max,
          ROUND(AVG(salary), 2) as global_avg,
          COUNT(DISTINCT country) as total_countries,
          COUNT(DISTINCT department) as total_departments,
          COUNT(DISTINCT job_title) as total_job_titles
        FROM employees
      `)
      .get();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
