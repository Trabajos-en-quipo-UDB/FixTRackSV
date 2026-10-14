import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export function db() {
  if (globalThis.fixtrackDb) return globalThis.fixtrackDb;
  if (process.env.VERCEL) throw new Error('Configure un backend persistente antes de desplegar en Vercel. SQLite local no es compatible con este despliegue.');
  const file = process.env.FIXTRACK_DB || path.join(process.cwd(), 'data', 'fixtrack.sqlite');
  mkdirSync(path.dirname(file), { recursive: true });
  const connection = new DatabaseSync(file);
  connection.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS clients(id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS equipment(id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id), type TEXT NOT NULL, brand TEXT NOT NULL, model TEXT NOT NULL, serial TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, equipment_id INTEGER NOT NULL REFERENCES equipment(id), technician_id INTEGER REFERENCES users(id), problem TEXT NOT NULL, priority TEXT NOT NULL, status TEXT NOT NULL, service_cost REAL NOT NULL DEFAULT 0 CHECK(service_cost >= 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS diagnostics(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), user_id INTEGER NOT NULL REFERENCES users(id), finding TEXT NOT NULL, work TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS parts(id INTEGER PRIMARY KEY, name TEXT NOT NULL, sku TEXT NOT NULL DEFAULT '', price REAL NOT NULL CHECK(price >= 0));
    CREATE TABLE IF NOT EXISTS lines(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), part_id INTEGER NOT NULL REFERENCES parts(id), quantity INTEGER NOT NULL CHECK(quantity > 0), unit_price REAL NOT NULL CHECK(unit_price >= 0));
    CREATE TABLE IF NOT EXISTS payments(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), amount REAL NOT NULL CHECK(amount > 0), method TEXT NOT NULL, reference TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), user_id INTEGER NOT NULL REFERENCES users(id), previous TEXT NOT NULL, next TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts(key TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, blocked_until INTEGER NOT NULL DEFAULT 0);
  `);
  globalThis.fixtrackDb = connection;
  return connection;
}
export function all(table) { return db().prepare(`SELECT * FROM ${table}`).all(); }
export function one(table, id) { return db().prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id); }
export function insert(table, data) {
  const keys = Object.keys(data);
  return Number(db().prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(data)).lastInsertRowid);
}
export function update(table, id, data) {
  const keys = Object.keys(data);
  db().prepare(`UPDATE ${table} SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id = ?`).run(...Object.values(data), id);
}
export function transaction(fn) {
  db().exec('BEGIN IMMEDIATE');
  try { const result = fn(); db().exec('COMMIT'); return result; }
  catch (e) { db().exec('ROLLBACK'); throw e; }
}
