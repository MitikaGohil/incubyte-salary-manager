import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET_COUNT = 10_000;
const BATCH_SIZE = 500;

// Load name files
function loadNames(file) {
  return readFileSync(join(__dirname, '../data', file), 'utf8')
    .split('\n')
    .map((n) => n.trim())
    .filter(Boolean);
}

const firstNames = loadNames('first_names.txt');
const lastNames = loadNames('last_names.txt');

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Germany', 'France',
  'India', 'Australia', 'Brazil', 'Japan', 'Singapore',
  'Netherlands', 'Spain', 'Sweden', 'Mexico', 'South Korea',
];

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
  'Finance', 'Human Resources', 'Legal', 'Operations', 'Customer Success',
];

const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer',
  'Engineering Manager', 'Product Manager', 'Senior Product Manager',
  'UX Designer', 'Data Scientist', 'Data Analyst', 'DevOps Engineer',
  'QA Engineer', 'Marketing Manager', 'Sales Representative', 'Account Executive',
  'Financial Analyst', 'HR Business Partner', 'Legal Counsel',
  'Operations Manager', 'Customer Success Manager',
];

const SALARY_BY_TITLE = {
  'Principal Engineer': [150000, 250000],
  'Staff Engineer': [130000, 200000],
  'Engineering Manager': [130000, 200000],
  'Senior Software Engineer': [110000, 170000],
  'Senior Product Manager': [120000, 180000],
  'Software Engineer': [80000, 130000],
  'Product Manager': [90000, 150000],
  'Data Scientist': [90000, 160000],
  'DevOps Engineer': [85000, 140000],
  'UX Designer': [75000, 130000],
  'Data Analyst': [70000, 110000],
  'QA Engineer': [65000, 110000],
  'Marketing Manager': [70000, 120000],
  'Legal Counsel': [100000, 180000],
  'Financial Analyst': [65000, 110000],
  'Operations Manager': [75000, 130000],
  'Account Executive': [70000, 140000],
  'Customer Success Manager': [65000, 110000],
  'Sales Representative': [50000, 90000],
  'HR Business Partner': [60000, 100000],
};

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];
const EMP_TYPE_WEIGHTS = [0.75, 0.10, 0.10, 0.05];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(arr, weights) {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < arr.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return arr[i];
  }
  return arr[arr.length - 1];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSalary(title) {
  const [min, max] = SALARY_BY_TITLE[title] || [40000, 120000];
  return Math.round(randInt(min, max) / 100) * 100;
}

function randomHireDate() {
  const start = new Date('2015-01-01').getTime();
  const end = new Date('2024-12-31').getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split('T')[0];
}

function generateEmail(name, index) {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
  return `${clean}.${index}@company.com`;
}

// Main seed function
function seed() {
  mkdirSync(join(__dirname, '../data'), { recursive: true });
  const db = new Database(process.env.DB_PATH || join(__dirname, '../data/salary.db'));

  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = OFF'); // Speed for bulk inserts
  db.pragma('cache_size = 20000');

  // Read and run schema
  const schema = readFileSync(
    join(__dirname, '../src/db/schema.sql'),
    'utf8'
  );
  db.exec(schema);

  // Check existing count
  const existing = db.prepare('SELECT COUNT(*) as c FROM employees').get().c;
  console.log(`Existing employees: ${existing}`);

  const needed = TARGET_COUNT - existing;
  if (needed <= 0) {
    console.log('Already seeded with sufficient records. Exiting.');
    db.close();
    return;
  }

  console.log(`Inserting ${needed} employees in batches of ${BATCH_SIZE}...`);
  const start = Date.now();

  const insert = db.prepare(`
    INSERT OR IGNORE INTO employees
      (full_name, job_title, department, country, salary, employment_type, email, hire_date)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((batch) => {
    for (const e of batch) {
      insert.run(
        e.full_name, e.job_title, e.department, e.country,
        e.salary, e.employment_type, e.email, e.hire_date
      );
    }
  });

  let inserted = 0;
  let batch = [];

  for (let i = 0; i < needed; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const jobTitle = pick(JOB_TITLES);
    const dept = pick(DEPARTMENTS);
    const country = pick(COUNTRIES);

    batch.push({
      full_name: fullName,
      job_title: jobTitle,
      department: dept,
      country,
      salary: randomSalary(jobTitle),
      employment_type: weightedPick(EMPLOYMENT_TYPES, EMP_TYPE_WEIGHTS),
      email: generateEmail(fullName, existing + i + 1),
      hire_date: randomHireDate(),
    });

    if (batch.length === BATCH_SIZE) {
      insertMany(batch);
      inserted += batch.length;
      batch = [];
      process.stdout.write(`\rProgress: ${inserted}/${needed}`);
    }
  }

  if (batch.length > 0) {
    insertMany(batch);
    inserted += batch.length;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  const total = db.prepare('SELECT COUNT(*) as c FROM employees').get().c;

  console.log(`\nDone! Inserted ${inserted} employees in ${elapsed}s`);
  console.log(`Total employees in DB: ${total}`);

  db.close();
}

seed();
