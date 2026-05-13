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
