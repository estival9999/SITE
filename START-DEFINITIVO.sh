#!/bin/bash

echo "================================================"
echo "🔥 INICIANDO SERVIDOR - SOLUÇÃO DEFINITIVA"
echo "================================================"

# Para TODOS os processos anteriores
pkill -f "npm" 2>/dev/null || true
pkill -f "tsx" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true
sleep 2

cd "/home/mateus/Área de trabalho/SITE_REPLIT"

# Limpa cache do npm
rm -rf node_modules/.cache 2>/dev/null || true

echo ""
echo "✅ Configurações:"
echo "   📍 Porta: 5000"
echo "   🌐 URL: http://localhost:5000"
echo "   🔑 Login: qualquer usuário/senha"
echo ""

# Executa diretamente com npx para evitar problemas
DEMO_MODE=true SESSION_SECRET=auraliscommunication npx tsx server/index.ts