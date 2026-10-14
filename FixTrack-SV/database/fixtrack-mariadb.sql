CREATE DATABASE IF NOT EXISTS fixtrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fixtrack;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  expires BIGINT NOT NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  email VARCHAR(150) NOT NULL DEFAULT '',
  address VARCHAR(300) NOT NULL DEFAULT ''
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  brand VARCHAR(60) NOT NULL,
  model VARCHAR(80) NOT NULL,
  serial VARCHAR(100) NOT NULL DEFAULT '',
  notes TEXT NOT NULL,
  CONSTRAINT fk_equipment_client FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  equipment_id INT NOT NULL,
  technician_id INT NULL,
  problem TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL,
  service_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at VARCHAR(40) NOT NULL,
  updated_at VARCHAR(40) NOT NULL,
  CONSTRAINT fk_orders_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  CONSTRAINT fk_orders_technician FOREIGN KEY (technician_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS diagnostics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  finding TEXT NOT NULL,
  work TEXT NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  CONSTRAINT fk_diagnostics_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_diagnostics_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS parts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sku VARCHAR(60) NOT NULL DEFAULT '',
  price DECIMAL(12,2) NOT NULL,
  CHECK (price >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `lines` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  part_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_lines_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_lines_part FOREIGN KEY (part_id) REFERENCES parts(id),
  CHECK (quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(30) NOT NULL,
  reference VARCHAR(150) NOT NULL DEFAULT '',
  created_at VARCHAR(40) NOT NULL,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CHECK (amount > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  previous VARCHAR(30) NOT NULL,
  next VARCHAR(30) NOT NULL,
  note VARCHAR(500) NOT NULL DEFAULT '',
  created_at VARCHAR(40) NOT NULL,
  CONSTRAINT fk_history_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS login_attempts (
  `key` VARCHAR(150) PRIMARY KEY,
  failures INT NOT NULL DEFAULT 0,
  blocked_until BIGINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;
