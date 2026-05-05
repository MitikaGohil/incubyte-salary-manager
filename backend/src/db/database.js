import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db;

export function getDb(dbPath = null) {
  if (db) return db;

  const resolvedPath = dbPath || join(__dirname, '../../data/salary.db');
  db = new Database(resolvedPath);

  // Performance pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 10000');
  db.pragma('foreign_keys = ON');

  // Initialize schema
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  return db;
}

export function resetDb() {
  if (db) {
    db.close();
    db = null;
  }
}
