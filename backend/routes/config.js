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
        gemini_key: '',
        provider: 'openrouter'
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get config error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/config — atualizar config do usuário logado
router.put('/config', authMiddleware, async (req, res) => {
  try {
    const { openrouter_key, openrouter_model, gemini_key, provider } = req.body;

    await query(`
      INSERT INTO configs (email, openrouter_key, openrouter_model, gemini_key, provider)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET
        openrouter_key = EXCLUDED.openrouter_key,
        openrouter_model = EXCLUDED.openrouter_model,
        gemini_key = EXCLUDED.gemini_key,
        provider = EXCLUDED.provider
    `, [
      req.userEmail,
      openrouter_key || '',
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

// GET /api/schedule — obter a escala compartilhada
router.get('/schedule', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT schedule, start_date, end_date, people, shifts, updated_by, updated_at FROM schedules WHERE id = 1');
    if (result.rows.length === 0) {
      return res.json({ schedule: {}, start_date: '', end_date: '', people: [], shifts: [] });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get schedule error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/schedule — salvar a escala compartilhada
router.put('/schedule', authMiddleware, async (req, res) => {
  try {
    const { schedule, start_date, end_date, people, shifts } = req.body;

    await query(`
      UPDATE schedules SET
        schedule = $1,
        start_date = $2,
        end_date = $3,
        people = $4,
        shifts = $5,
        updated_by = $6,
        updated_at = NOW()
      WHERE id = 1
    `, [
      JSON.stringify(schedule || {}),
      start_date || '',
      end_date || '',
      JSON.stringify(people || []),
      JSON.stringify(shifts || []),
      req.userEmail
    ]);

    res.json({ message: 'Escala salva com sucesso' });
  } catch (err) {
    console.error('Save schedule error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
