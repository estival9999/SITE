#!/bin/bash

echo "================================================"
echo "🚀 INICIANDO SERVIDOR AURALIS EM MODO DEMO"
echo "================================================"
echo ""
echo "✅ Use os seguintes logins:"
echo "   - admin/admin (Administrador)"
echo "   - user/user (Leitor)"
echo ""
echo "URL: http://localhost:5000"
echo "================================================"
echo ""

# Para qualquer processo anterior
pkill -f "npm run dev" 2>/dev/null || true
pkill -f tsx 2>/dev/null || true

# Define variáveis de ambiente
export DEMO_MODE=true
export SESSION_SECRET=auraliscommunication
export NODE_ENV=development

# Executa o servidor
npm run dev