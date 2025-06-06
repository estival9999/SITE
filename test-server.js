const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Servidor funcionando!\n');
});

const port = 3333;
server.listen(port, '127.0.0.1', () => {
  console.log(`Servidor de teste rodando em http://localhost:${port}`);
});