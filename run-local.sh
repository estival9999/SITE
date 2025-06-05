#!/bin/bash
# Script para executar o site localmente

echo "Iniciando servidor Auralis..."
echo "================================"
echo ""
echo "Dados de acesso de demonstração:"
echo "--------------------------------"
echo "Administrador:"
echo "  Usuário: admin"
echo "  Senha: admin"
echo ""
echo "Usuário comum:"
echo "  Usuário: user"
echo "  Senha: user"
echo ""
echo "================================"
echo ""

# Define as variáveis de ambiente
export SESSION_SECRET=auraliscommunication
export DEMO_MODE=true

# Inicia o servidor
npm run dev