#!/bin/bash

# SCRIPT DEFINITIVO PARA INICIAR O SERVIDOR

echo "================================================"
echo "🔥 INICIANDO SERVIDOR DEFINITIVO - PORTA 8080"
echo "================================================"
echo ""

# Mata qualquer processo anterior
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "tsx" 2>/dev/null || true
pkill -f "node.*dist/index.js" 2>/dev/null || true
sleep 2

cd "/home/mateus/Área de trabalho/SITE_REPLIT"

# Configura variáveis
export DEMO_MODE=true
export SESSION_SECRET=auraliscommunication
export PORT=8080
export NODE_ENV=development

echo "✅ Servidor configurado para:"
echo "   📍 Porta: 8080"
echo "   🌐 URL: http://localhost:8080"
echo "   🔑 Login: Use qualquer usuário/senha"
echo ""
echo "================================================"
echo ""

# Inicia o servidor
exec npm run dev