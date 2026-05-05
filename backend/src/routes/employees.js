import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { getDb } from '../db/database.js';

const router = Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const employeeValidators = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('job_title').trim().notEmpty().withMessage('Job title is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('salary')
    .isFloat({ min: 0 })
    .withMessage('Salary must be a non-negative number'),
  body('employment_type')
    .optional()
    .isIn(['Full-time', 'Part-time', 'Contract', 'Intern'])
    .withMessage('Invalid employment type'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('hire_date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Hire date must be YYYY-MM-DD'),
];

// GET /api/employees - paginated list with search/filter
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('search').optional().trim(),
    query('country').optional().trim(),
    query('department').optional().trim(),
    query('job_title').optional().trim(),
    query('sort_by')
      .optional()
      .isIn(['full_name', 'salary', 'hire_date', 'country', 'department']),
    query('sort_order').optional().isIn(['asc', 'desc']),
  ],
  handleValidation,
  (req, res) => {
    try {
      const db = getDb();
      const page = req.query.page || 1;
      const limit = req.query.limit || 50;
      const offset = (page - 1) * limit;
      const {
        search,
        country,
        department,
        job_title,
        sort_by = 'full_name',
        sort_order = 'asc',
      } = req.query;

      const conditions = [];
      const params = [];

      if (search) {
        conditions.push(
          "(full_name LIKE ? OR email LIKE ? OR job_title LIKE ?)"
        );
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (country) {
        conditions.push('country = ?');
        params.push(country);
      }
      if (department) {
        conditions.push('department = ?');
        params.push(department);
      }
      if (job_title) {
        conditions.push('job_title = ?');
        params.push(job_title);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderClause = `ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;

      const total = db
        .prepare(`SELECT COUNT(*) as count FROM employees ${where}`)
        .get(...params).count;

      const employees = db
        .prepare(
          `SELECT * FROM employees ${where} ${orderClause} LIMIT ? OFFSET ?`
        )
        .all(...params, limit, offset);

      res.json({ data: employees, total, page, limit });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/employees/:id
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).toInt()],
  handleValidation,
  (req, res) => {
    try {
      const db = getDb();
      const employee = db
        .prepare('SELECT * FROM employees WHERE id = ?')
        .get(req.params.id);
      if (!employee) return res.status(404).json({ error: 'Employee not found' });
      res.json(employee);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/employees
router.post('/', employeeValidators, handleValidation, (req, res) => {
  try {
    const db = getDb();
    const {
      full_name,
      job_title,
      department,
      country,
      salary,
      employment_type = 'Full-time',
      email,
      hire_date,
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO employees (full_name, job_title, department, country, salary, employment_type, email, hire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      full_name,
      job_title,
      department,
      country,
      salary,
      employment_type,
      email,
      hire_date
    );
    const employee = db
      .prepare('SELECT * FROM employees WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json(employee);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/employees/:id
router.put(
  '/:id',
  [param('id').isInt({ min: 1 }).toInt(), ...employeeValidators],
  handleValidation,
  (req, res) => {
    try {
      const db = getDb();
      const {
        full_name,
        job_title,
        department,
        country,
        salary,
        employment_type = 'Full-time',
        email,
        hire_date,
      } = req.body;

      const stmt = db.prepare(`
        UPDATE employees
        SET full_name=?, job_title=?, department=?, country=?, salary=?,
            employment_type=?, email=?, hire_date=?, updated_at=datetime('now')
        WHERE id=?
      `);
      const result = stmt.run(
        full_name,
        job_title,
        department,
        country,
        salary,
        employment_type,
        email,
        hire_date,
        req.params.id
      );
      if (result.changes === 0)
        return res.status(404).json({ error: 'Employee not found' });

      const employee = db
        .prepare('SELECT * FROM employees WHERE id = ?')
        .get(req.params.id);
      res.json(employee);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /api/employees/:id
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).toInt()],
  handleValidation,
  (req, res) => {
    try {
      const db = getDb();
      const result = db
        .prepare('DELETE FROM employees WHERE id = ?')
        .run(req.params.id);
      if (result.changes === 0)
        return res.status(404).json({ error: 'Employee not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/employees/meta/filters — distinct values for filter dropdowns
router.get('/meta/filters', (req, res) => {
  try {
    const db = getDb();
    const countries = db
      .prepare('SELECT DISTINCT country FROM employees ORDER BY country')
      .all()
      .map((r) => r.country);
    const departments = db
      .prepare('SELECT DISTINCT department FROM employees ORDER BY department')
      .all()
      .map((r) => r.department);
    const job_titles = db
      .prepare('SELECT DISTINCT job_title FROM employees ORDER BY job_title')
      .all()
      .map((r) => r.job_title);
    res.json({ countries, departments, job_titles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
