const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "equipment_portal.db");

let db;

const initializeSchema = (conn) => {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'staff', 'admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      equipment_condition TEXT NOT NULL,
      description TEXT,
      total_quantity INTEGER NOT NULL CHECK(total_quantity >= 0),
      available_quantity INTEGER NOT NULL CHECK(available_quantity >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS borrow_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      equipment_name TEXT NOT NULL,
      requester_id INTEGER NOT NULL,
      requester_name TEXT NOT NULL,
      requester_role TEXT NOT NULL CHECK(requester_role IN ('student', 'staff', 'admin')),
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED')),
      approved_by INTEGER,
      approver_name TEXT,
      remarks TEXT,
      issued_at TEXT,
      returned_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment(name);
    CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
    CREATE INDEX IF NOT EXISTS idx_requests_equipment ON borrow_requests(equipment_id);
    CREATE INDEX IF NOT EXISTS idx_requests_requester ON borrow_requests(requester_id);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON borrow_requests(status);
  `);
};

const getDb = () => {
  if (!db) {
    fs.mkdirSync(dataDir, { recursive: true });
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initializeSchema(db);
  }
  return db;
};

module.exports = {
  getDb,
  dbPath,
};
