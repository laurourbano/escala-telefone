const express = require('express');
const cors = require('cors');
const configRoutes = require('./routes/config');
const { initTables, closeDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'https://laurourbano.github.io',
  'https://escalatelefone.netlify.app',
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  const maxRetries = 2;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await initTables();
      console.log('Conectado ao banco de dados com sucesso.');
      app.listen(PORT, () => {
        console.log(`EscalaAI backend rodando em http://localhost:${PORT}`);
      });
      return;
    } catch (err) {
      lastError = err;
      console.log(`Tentativa ${i + 1}/${maxRetries} de conectar ao banco falhou. Aguardando 3s...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.error('Erro ao conectar ao banco após várias tentativas:', lastError);
  process.exit(1);
}

start();

process.on('SIGINT', async () => {
  console.log('Encerrando servidor...');
  await closeDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDb();
  process.exit(0);
});
