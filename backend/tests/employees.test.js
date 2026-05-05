import request from 'supertest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createApp } from '../src/app.js';
import { resetDb } from '../src/db/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let app;
let testDb;
const TEST_DB = ':memory:';

const sampleEmployee = {
  full_name: 'Jane Doe',
  job_title: 'Software Engineer',
  department: 'Engineering',
  country: 'United States',
  salary: 95000,
  employment_type: 'Full-time',
  email: 'jane.doe@example.com',
  hire_date: '2022-03-15',
};

beforeEach(() => {
  resetDb();
  app = createApp(TEST_DB);
});

afterEach(() => {
  resetDb();
});

describe('POST /api/employees', () => {
  test('creates a new employee with valid data', async () => {
    const res = await request(app).post('/api/employees').send(sampleEmployee);
    expect(res.status).toBe(201);
    expect(res.body.full_name).toBe('Jane Doe');
    expect(res.body.id).toBeDefined();
  });

  test('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ full_name: 'Only Name' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('returns 400 for negative salary', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ ...sampleEmployee, salary: -5000 });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ ...sampleEmployee, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  test('returns 409 for duplicate email', async () => {
    await request(app).post('/api/employees').send(sampleEmployee);
    const res = await request(app).post('/api/employees').send(sampleEmployee);
    expect(res.status).toBe(409);
  });
});

describe('GET /api/employees', () => {
  beforeEach(async () => {
    await request(app).post('/api/employees').send(sampleEmployee);
  });

  test('returns paginated list', async () => {
    const res = await request(app).get('/api/employees?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  test('filters by country', async () => {
    const res = await request(app).get(
      '/api/employees?country=United+States'
    );
    expect(res.status).toBe(200);
    expect(res.body.data[0].country).toBe('United States');
  });

  test('searches by name', async () => {
    const res = await request(app).get('/api/employees?search=Jane');
    expect(res.status).toBe(200);
    expect(res.body.data[0].full_name).toContain('Jane');
  });

  test('returns empty for non-matching search', async () => {
    const res = await request(app).get('/api/employees?search=ZZZNOMATCH');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  test('returns filter metadata for the UI', async () => {
    const res = await request(app).get('/api/employees/meta/filters');
    expect(res.status).toBe(200);
    expect(res.body.countries).toContain('United States');
    expect(res.body.departments).toContain('Engineering');
    expect(res.body.job_titles).toContain('Software Engineer');
  });
});

describe('GET /api/employees/:id', () => {
  test('returns employee by id', async () => {
    const create = await request(app)
      .post('/api/employees')
      .send(sampleEmployee);
    const res = await request(app).get(`/api/employees/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('jane.doe@example.com');
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/employees/99999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/employees/:id', () => {
  test('updates employee data', async () => {
    const create = await request(app)
      .post('/api/employees')
      .send(sampleEmployee);
    const res = await request(app)
      .put(`/api/employees/${create.body.id}`)
      .send({ ...sampleEmployee, salary: 110000 });
    expect(res.status).toBe(200);
    expect(res.body.salary).toBe(110000);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app)
      .put('/api/employees/99999')
      .send(sampleEmployee);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/employees/:id', () => {
  test('deletes an employee', async () => {
    const create = await request(app)
      .post('/api/employees')
      .send(sampleEmployee);
    const del = await request(app).delete(`/api/employees/${create.body.id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/employees/${create.body.id}`);
    expect(get.status).toBe(404);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/employees/99999');
    expect(res.status).toBe(404);
  });
});
