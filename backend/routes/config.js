const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../database');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/register — criar usuário
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const existing = await query('SELECT email FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);
    await query('INSERT INTO configs (email) VALUES ($1) ON CONFLICT DO NOTHING', [email]);

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

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
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
    const result = await query('SELECT * FROM configs WHERE email = $1', [req.userEmail]);

    if (result.rows.length === 0) {
      await query('INSERT INTO configs (email) VALUES ($1) ON CONFLICT DO NOTHING', [req.userEmail]);
      return res.json({
        openrouter_key: '',
        openrouter_model: 'google/gemini-2.0-flash-exp',

      openrouter_model || 'google/gemini-2.0-flash-exp',
      gemini_key || '',
      provider || 'openrouter'
    ]);

    res.json({ message: 'Configuração salva com sucesso' });
  } catch (err) {
    console.error('Save config error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
