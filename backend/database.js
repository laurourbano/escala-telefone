const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

console.log('DATABASE_URL definida:', !!DATABASE_URL);

const pool = new Pool({
  connectionString: DATABASE_URL || 'postgresql://localhost:5432/escalai',
  ssl: DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS configs (
        email TEXT PRIMARY KEY REFERENCES users(email),
        openrouter_key TEXT DEFAULT '',
        openrouter_model TEXT DEFAULT 'google/gemini-2.0-flash-exp',
        gemini_key TEXT DEFAULT '',
        provider TEXT DEFAULT 'openrouter'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        schedule JSONB DEFAULT '{}',
        start_date TEXT DEFAULT '',
        end_date TEXT DEFAULT '',
        people JSONB DEFAULT '[]',
        shifts JSONB DEFAULT '[]',
        updated_by TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure the single row exists
    await client.query(`
      INSERT INTO schedules (id) VALUES (1) ON CONFLICT (id) DO NOTHING
    `);

    console.log('Tabelas verificadas/criadas com sucesso.');
  } finally {
    client.release();
  }
}

async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

async function closeDb() {
  await pool.end();
}

module.exports = { query, initTables, closeDb };
