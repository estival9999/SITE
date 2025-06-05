#!/usr/bin/env node

console.log("=================================");
console.log("Iniciando Servidor Auralis Local");
console.log("=================================");
console.log("");
console.log("Credenciais de demonstração:");
console.log("- Admin: usuário 'admin', senha 'admin'");
console.log("- Usuário: usuário 'user', senha 'user'");
console.log("");

// Configurar variáveis de ambiente
process.env.DEMO_MODE = 'true';
process.env.SESSION_SECRET = 'auraliscommunication';
process.env.NODE_ENV = 'development';

// Executar o servidor
import('./server/index.js').catch(err => {
  console.error("Erro ao iniciar servidor:", err);
  process.exit(1);
});