const express = require('express');
const cors = require('cors');
const configRoutes = require('./routes/config');
const { initTables, closeDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - em produção, restrinja à URL do seu frontend
const allowedOrigins = [
  'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'https://laurourbano.github.io',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || !process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use('/api', configRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inicializa o banco e sobe o servidor
async function start() {
  try {
    await initTables();
    app.listen(PORT, () => {
      console.log(`EscalAI backend rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Encerrando servidor...');
  await closeDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDb();
  process.exit(0);
});
