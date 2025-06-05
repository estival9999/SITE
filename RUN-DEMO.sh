#!/bin/bash

echo "================================================"
echo "🔥 INICIANDO SERVIDOR EM MODO DEMO ULTRA SIMPLES"
echo "================================================"
echo ""
echo "✅ QUALQUER LOGIN VAI FUNCIONAR!"
echo "✅ Use qualquer usuário e senha!"
echo "✅ Exemplo: admin/admin ou teste/123 ou qualquer coisa!"
echo ""
echo "URL: http://localhost:5000"
echo "================================================"
echo ""

# Para qualquer processo anterior
pkill -f "npm run dev" 2>/dev/null || true
pkill -f tsx 2>/dev/null || true

# Limpa e inicia
cd "/home/mateus/Área de trabalho/SITE_REPLIT"
export DEMO_MODE=true
export SESSION_SECRET=auraliscommunication
export NODE_ENV=development

# Executa
exec npm run dev