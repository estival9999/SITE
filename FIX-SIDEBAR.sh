#!/bin/bash

echo "================================================"
echo "🔧 CORREÇÃO DEFINITIVA DO BUG DA SIDEBAR"
echo "================================================"
echo ""
echo "✅ Removido transform/translate que causava piscar"
echo "✅ Simplificado CSS para evitar conflitos"
echo "✅ Adicionado indicador visual sem animação"
echo "✅ Background fixo sem transições desnecessárias"
echo ""
echo "Reiniciando servidor..."
echo "================================================"

# Para qualquer processo anterior
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

cd "/home/mateus/Área de trabalho/SITE_REPLIT"
export DEMO_MODE=true
export SESSION_SECRET=auraliscommunication

echo ""
echo "🚀 Servidor iniciando..."
echo "🌐 Acesse: http://localhost:5000"
echo "✅ Login: qualquer usuário/senha"
echo ""

npm run dev