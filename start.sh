#!/bin/bash
cd "/home/mateus/Área de trabalho/SITE_REPLIT"

echo "================================="
echo "🚀 Iniciando Servidor Auralis"
echo "================================="
echo ""
echo "📋 Credenciais de demonstração:"
echo "   Admin: admin / admin"
echo "   User: user / user"
echo ""
echo "🌐 URL: http://localhost:5000"
echo "================================="
echo ""

export DEMO_MODE=true
export SESSION_SECRET=auraliscommunication
export NODE_ENV=development

# Executar com npm diretamente
exec npm run dev