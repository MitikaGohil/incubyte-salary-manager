import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDb } from '../src/db/database.js';

let app;

const employees = [
  {
    full_name: 'Alice Smith',
    job_title: 'Software Engineer',
    department: 'Engineering',
    country: 'United States',
    salary: 90000,
    employment_type: 'Full-time',
    email: 'alice@example.com',
    hire_date: '2020-01-10',
  },
  {
    full_name: 'Bob Jones',
    job_title: 'Software Engineer',
    department: 'Engineering',
    country: 'United States',
    salary: 110000,
    employment_type: 'Full-time',
    email: 'bob@example.com',
    hire_date: '2019-06-01',
  },
  {
    full_name: 'Carol Lee',
    job_title: 'Product Manager',
    department: 'Product',
    country: 'Canada',
    salary: 95000,
    employment_type: 'Full-time',
    email: 'carol@example.com',
    hire_date: '2021-03-15',
  },
];

beforeEach(async () => {
  resetDb();
  app = createApp(':memory:');
  for (const emp of employees) {
    await request(app).post('/api/employees').send(emp);
  }
});

afterEach(() => {
  resetDb();
});

describe('GET /api/insights/summary', () => {
  test('returns global summary stats', async () => {
    const res = await request(app).get('/api/insights/summary');
    expect(res.status).toBe(200);
    expect(res.body.total_employees).toBe(3);
    expect(res.body.global_min).toBe(90000);
    expect(res.body.global_max).toBe(110000);
    expect(res.body.total_countries).toBe(2);
  });
});

describe('GET /api/insights/salary-by-country', () => {
  test('returns per-country salary stats', async () => {
    const res = await request(app).get('/api/insights/salary-by-country');
    expect(res.status).toBe(200);
    const us = res.body.find((r) => r.country === 'United States');
    expect(us).toBeDefined();
    expect(us.min_salary).toBe(90000);
    expect(us.max_salary).toBe(110000);
    expect(us.avg_salary).toBe(100000);
    expect(us.employee_count).toBe(2);
  });
});

describe('GET /api/insights/salary-by-department', () => {
  test('returns department salary stats', async () => {
    const res = await request(app).get('/api/insights/salary-by-department');
    expect(res.status).toBe(200);
    const engineering = res.body.find((r) => r.department === 'Engineering');
    expect(engineering).toBeDefined();
    expect(engineering.employee_count).toBe(2);
    expect(engineering.avg_salary).toBe(100000);
  });
});

describe('GET /api/insights/salary-by-job-country', () => {
  test('returns job+country breakdown', async () => {
    const res = await request(app).get('/api/insights/salary-by-job-country');
    expect(res.status).toBe(200);
    const sw = res.body.find(
      (r) => r.job_title === 'Software Engineer' && r.country === 'United States'
    );
    expect(sw).toBeDefined();
    expect(sw.avg_salary).toBe(100000);
  });

  test('filters by country', async () => {
    const res = await request(app).get(
      '/api/insights/salary-by-job-country?country=Canada'
    );
    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.country === 'Canada')).toBe(true);
  });
});

describe('GET /api/insights/top-paid', () => {
  test('returns top earners', async () => {
    const res = await request(app).get('/api/insights/top-paid?limit=1');
    expect(res.status).toBe(200);
    expect(res.body[0].salary).toBe(110000);
  });
});

describe('GET /api/insights/employment-type-breakdown', () => {
  test('returns breakdown', async () => {
    const res = await request(app).get(
      '/api/insights/employment-type-breakdown'
    );
    expect(res.status).toBe(200);
    expect(res.body[0].employment_type).toBe('Full-time');
    expect(res.body[0].count).toBe(3);
  });
});
