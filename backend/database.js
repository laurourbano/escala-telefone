const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'escalai.db');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  initTables(db);
  saveDb();
  return db;
}

function initTables(database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS configs (
      email TEXT PRIMARY KEY REFERENCES users(email),
      openrouter_key TEXT DEFAULT '',
      openrouter_model TEXT DEFAULT 'google/gemini-2.0-flash-001',
      gemini_key TEXT DEFAULT '',
      provider TEXT DEFAULT 'openrouter'
    )
  `);
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb, saveDb };
