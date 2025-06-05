import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Servir arquivos estáticos
app.use(express.static(join(__dirname, 'client')));

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!' });
});

// Rota catch-all para o SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'client', 'index.html'));
});

app.listen(port, () => {
  console.log(`✨ Servidor rodando em: http://localhost:${port}`);
});