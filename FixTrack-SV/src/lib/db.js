import mysql from 'mysql2/promise';
import { AsyncLocalStorage } from 'node:async_hooks';

const transactions = new AsyncLocalStorage();
const tables = new Set(['users', 'sessions', 'clients', 'equipment', 'orders', 'diagnostics', 'parts', 'lines', 'payments', 'history', 'login_attempts']);
let pool;
let schema;

function config() {
  return {
    host: process.env.MARIADB_HOST || '127.0.0.1',
    port: Number(process.env.MARIADB_PORT || 3307),
    user: process.env.MARIADB_USER || 'root',
    password: process.env.MARIADB_PASSWORD || '',
    database: process.env.MARIADB_DATABASE || 'fixtrack',
    waitForConnections: true,
    connectionLimit: Number(process.env.MARIADB_CONNECTION_LIMIT || 5),
    dateStrings: true
  };
}

export function db() {
  if (!pool) pool = mysql.createPool(config());
  return pool;
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = undefined;
    schema = undefined;
  }
}

function connection() {
  return transactions.getStore() || db();
}

async function initialize() {
  if (!schema) {
    schema = (async () => {
      const connection = db();
      await connection.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL, role VARCHAR(30) NOT NULL, active TINYINT(1) NOT NULL DEFAULT 1
      ) ENGINE=InnoDB`);
      await connection.query(`CREATE TABLE IF NOT EXISTS sessions (
        token CHAR(64) PRIMARY KEY, user_id INT NOT NULL, expires BIGINT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`);
      await connection.query(`CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, phone VARCHAR(25) NOT NULL,
        email VARCHAR(150) NOT NULL DEFAULT '', address VARCHAR(300) NOT NULL DEFAULT ''
      ) ENGINE=InnoDB`);
      await connection.query(`CREATE TABLE IF NOT EXISTS equipment (
        id INT AUTO_INCREMENT PRIMARY KEY, client_id INT NOT NULL, type VARCHAR(50) NOT NULL,
        brand VARCHAR(60) NOT NULL, model VARCHAR(80) NOT NULL, serial VARCHAR(100) NOT NULL DEFAULT '',
        notes TEXT NOT NULL, FOREIGN KEY (client_id) REFERENCES clients(id)
      ) ENGINE=InnoDB`);
      await connection.query(`CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(40) UNIQUE NOT NULL, equipment_id INT NOT NULL,
        technician_id INT NULL, problem TEXT NOT NULL, priority VARCHAR(20) NOT NULL, status VARCHAR(30) NOT NULL,
        service_cost DECIMAL(12,2) NOT NULL DEFAULT 0, created_at VARCHAR(40) NOT NULL, updated_at VARCHAR(40) NOT NULL,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id), FOREIGN KEY (technician_id) REFERENCES users(id)
      ) ENGINE=InnoDB`);
      await connection.query(`CREATE TABLE IF NOT EXISTS diagnostics (
        id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, user_id INT NOT NULL, finding TEXT NOT NULL,
        work TEXT NOT NULL, created_at VARCHAR(40) NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB`);
      await connection.query(`CREATE TABLE IF NOT EXISTS parts (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, sku VARCHAR(60) NOT NULL DEFAULT '',
        price DECIMAL(12,2) NOT NULL, CHECK (price >= 0)
      ) ENGINE=InnoDB`);
      await connection.query(`CREATE TABLE IF NOT EXISTS \`lines\` (
        id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, part_id INT NOT NULL, quantity INT NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (part_id) REFERENCES parts(id), CHECK (quantity > 0)
      ) ENGINE=InnoDB`);
      await connection.query(`CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL,
        method VARCHAR(30) NOT NULL, reference VARCHAR(150) NOT NULL DEFAULT '', created_at VARCHAR(40) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id), CHECK (amount > 0)
      ) ENGINE=InnoDB`);
      await connection.query(`CREATE TABLE IF NOT EXISTS history (
        id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, user_id INT NOT NULL, previous VARCHAR(30) NOT NULL,
        next VARCHAR(30) NOT NULL, note VARCHAR(500) NOT NULL DEFAULT '', created_at VARCHAR(40) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id), FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB`);
      await connection.query(`CREATE TABLE IF NOT EXISTS login_attempts (
        \`key\` VARCHAR(150) PRIMARY KEY, failures INT NOT NULL DEFAULT 0, blocked_until BIGINT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB`);
    })().catch(error => { schema = undefined; throw error; });
  }
  await schema;
}

function assertTable(table) {
  if (!tables.has(table)) throw new Error('Tabla no permitida.');
}

export async function all(table) {
  assertTable(table); await initialize();
  const [rows] = await connection().query(`SELECT * FROM \`${table}\``);
  return rows;
}

export async function one(table, id) {
  assertTable(table); await initialize();
  const [rows] = await connection().query(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
  return rows[0] || null;
}

export async function insert(table, data) {
  assertTable(table); await initialize();
  const keys = Object.keys(data);
  const [result] = await connection().query(`INSERT INTO \`${table}\` (\`${keys.join('`,`')}\`) VALUES (${keys.map(() => '?').join(',')})`, Object.values(data));
  return Number(result.insertId);
}

export async function update(table, id, data) {
  assertTable(table); await initialize();
  const keys = Object.keys(data);
  await connection().query(`UPDATE \`${table}\` SET ${keys.map(k => `\`${k}\` = ?`).join(',')} WHERE id = ?`, [...Object.values(data), id]);
}

export async function query(sql, values = []) {
  await initialize();
  const [rows] = await connection().query(sql, values);
  return rows;
}

export async function transaction(fn) {
  await initialize();
  const connection = await db().getConnection();
  try {
    await connection.beginTransaction();
    const result = await transactions.run(connection, fn);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
