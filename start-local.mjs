#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("=================================");
console.log("Iniciando Servidor Auralis Local");
console.log("=================================");
console.log("");
console.log("Credenciais de demonstração:");
console.log("- Admin: usuário 'admin', senha 'admin'");
console.log("- Usuário: usuário 'user', senha 'user'");
console.log("");
console.log("Acesse: http://localhost:5000");
console.log("=================================");
console.log("");

// Configurar variáveis de ambiente
const env = {
  ...process.env,
  DEMO_MODE: 'true',
  SESSION_SECRET: 'auraliscommunication',
  NODE_ENV: 'development'
};

// Executar o servidor
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  env: env,
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Servidor encerrado com código ${code}`);
  process.exit(code || 0);
});

// Tratar sinais de interrupção
process.on('SIGINT', () => {
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});