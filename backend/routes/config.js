const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, saveDb } = require('../database');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/register — criar usuário
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const db = await getDb();
    const existing = db.exec(`SELECT email FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const safeEmail = email.replace(/'/g, "''");
    db.run(`INSERT INTO users (email, password) VALUES ('${safeEmail}', '${hashedPassword.replace(/'/g, "''")}')`);
    db.run(`INSERT INTO configs (email) VALUES ('${safeEmail}')`);
    saveDb();

    const token = generateToken(email);
    res.status(201).json({ token, email });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/login — autenticar
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const db = await getDb();
    const safeEmail = email.replace(/'/g, "''");
    const result = db.exec(`SELECT * FROM users WHERE email = '${safeEmail}'`);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const emailIdx = columns.indexOf('email');
    const passIdx = columns.indexOf('password');

    const match = await bcrypt.compare(password, row[passIdx]);
    if (!match) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(email);
    res.json({ token, email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/config — obter config do usuário logado
router.get('/config', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const safeEmail = req.userEmail.replace(/'/g, "''");
    const result = db.exec(`SELECT * FROM configs WHERE email = '${safeEmail}'`);

    if (result.length === 0 || result[0].values.length === 0) {
      db.run(`INSERT INTO configs (email) VALUES ('${safeEmail}')`);
      saveDb();
      return res.json({
        openrouter_key: '',
        openrouter_model: 'google/gemini-2.0-flash-001',
        gemini_key: '',
        provider: 'openrouter'
      });
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const config = {};
    columns.forEach((col, idx) => { config[col] = row[idx]; });
    res.json(config);
  } catch (err) {
    console.error('Get config error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/config — atualizar config do usuário logado
router.put('/config', authMiddleware, async (req, res) => {
  try {
    const { openrouter_key, openrouter_model, gemini_key, provider } = req.body;
    const db = await getDb();
    const safeEmail = req.userEmail.replace(/'/g, "''");

    const existing = db.exec(`SELECT email FROM configs WHERE email = '${safeEmail}'`);

    if (existing.length > 0 && existing[0].values.length > 0) {
      db.run(`
        UPDATE configs SET
          openrouter_key = '${(openrouter_key || '').replace(/'/g, "''")}',
          openrouter_model = '${(openrouter_model || 'google/gemini-2.0-flash-001').replace(/'/g, "''")}',
          gemini_key = '${(gemini_key || '').replace(/'/g, "''")}',
          provider = '${(provider || 'openrouter').replace(/'/g, "''")}'
        WHERE email = '${safeEmail}'
      `);
    } else {
      db.run(`
        INSERT INTO configs (email, openrouter_key, openrouter_model, gemini_key, provider)
        VALUES (
          '${safeEmail}',
          '${(openrouter_key || '').replace(/'/g, "''")}',
          '${(openrouter_model || 'google/gemini-2.0-flash-001').replace(/'/g, "''")}',
          '${(gemini_key || '').replace(/'/g, "''")}',
          '${(provider || 'openrouter').replace(/'/g, "''")}'
        )
      `);
    }

    saveDb();
    res.json({ message: 'Configuração salva com sucesso' });
  } catch (err) {
    console.error('Save config error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
