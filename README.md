# Sistema Auralis - Comunicados Corporativos

Sistema de comunicados corporativos com interface moderna em verde escuro.

## 🚀 Como Executar

### Modo Demonstração (Recomendado)

```bash
cd "/home/mateus/Área de trabalho/SITE_REPLIT"
./RUN-DEMO.sh
```

Ou manualmente:

```bash
DEMO_MODE=true SESSION_SECRET=auraliscommunication npm run dev
```

### Acesso

- **URL**: http://localhost:5000
- **Login**: Use qualquer usuário/senha (ex: admin/admin)

## 🎨 Características

- **Tema Verde Escuro**: Interface profissional com paleta de cores em verde
- **Menu Lateral Otimizado**: Transições suaves sem bugs de hover
- **Modo Demo**: Login simplificado para testes
- **Responsivo**: Funciona em desktop e mobile

## 📦 Estrutura

```
/client         - Frontend React + TypeScript
/server         - Backend Express + TypeScript  
/shared         - Tipos compartilhados
```

## 🔧 Tecnologias

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express, TypeScript, Passport.js
- **Build**: Vite, ESBuild

## 🐛 Correções Aplicadas

1. **Paleta de Cores**: Mudança completa para verde escuro
2. **Bug Menu Lateral**: Corrigido problema de flickering no hover
3. **Login Simplificado**: Modo demo aceita qualquer credencial
4. **Performance**: Otimizações de CSS e animações

## 📝 Notas

- No modo demo, os dados são armazenados em memória
- Não requer banco de dados para executar
- Ideal para demonstrações e desenvolvimento