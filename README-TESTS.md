# Scripts de Teste para Chat AURALIS

Este diretório contém scripts automatizados para testar múltiplas interações com o sistema de chat do AURALIS.

## Objetivo

Verificar se o sistema de chat continua funcionando corretamente após múltiplas mensagens, testando:
- Login automático
- Envio de 15+ mensagens em sequência
- Tempo de resposta
- Persistência do input após múltiplas interações
- Taxa de sucesso das requisições

## Scripts Disponíveis

### 1. test-chat.js (Node.js)
Script mais completo com relatórios detalhados.

**Requisitos:**
- Node.js instalado
- npm install node-fetch (se necessário)

**Uso:**
```bash
node test-chat.js
# ou com URL customizada:
BASE_URL=http://localhost:3000 node test-chat.js
```

### 2. test-chat.py (Python)
Script Python que usa apenas bibliotecas padrão.

**Requisitos:**
- Python 3.x

**Uso:**
```bash
python3 test-chat.py
# ou com URL customizada:
python3 test-chat.py http://localhost:3000
```

### 3. test-chat-curl.sh (Bash/Shell)
Script shell que usa curl para ambientes Unix/Linux.

**Requisitos:**
- curl
- jq (opcional, para melhor formatação)

**Uso:**
```bash
./test-chat-curl.sh
# ou com URL customizada:
BASE_URL=http://localhost:3000 ./test-chat-curl.sh
```

## O que os Scripts Testam

1. **Login Automático**: Faz login com credenciais de teste
2. **15 Mensagens Sequenciais**: Envia mensagens variadas sobre o sistema
3. **Delay entre Mensagens**: 2 segundos entre cada mensagem
4. **Medição de Performance**: Tempo de resposta de cada requisição
5. **Teste de Persistência**: Verifica se o input continua funcionando após todas as mensagens
6. **Relatório Detalhado**: Gera estatísticas e salva em arquivo

## Mensagens de Teste

Os scripts enviam as seguintes mensagens:
1. Saudação inicial
2. Como criar comunicados
3. Categorias disponíveis
4. Sobre o sistema AURALIS
5. Visualizar comunicados antigos
6. Diferença entre roles (ADMIN/READER)
7. Anexar arquivos
8. Sistema de perguntas
9. Mapa mental
10. Busca de comunicados
11. Filtros de busca
12. Marcar como lido
13. Exportar relatórios
14. Alterar senha
15. API REST

## Interpretando os Resultados

### Indicadores de Sucesso ✅
- Taxa de sucesso > 95%
- Tempo médio de resposta < 3000ms
- Input continua funcionando após todas as mensagens
- Todas as respostas contêm conteúdo válido

### Indicadores de Problema ❌
- Taxa de sucesso < 80%
- Timeouts frequentes
- Erros 401 (autenticação)
- Erros 500 (servidor)
- Input para de funcionar

## Arquivos Gerados

- `chat-test-report-[timestamp].json`: Relatório detalhado em JSON
- `chat-test-[timestamp].log`: Log completo da execução (script bash)
- `test-cookies.txt`: Cookies de sessão temporários (removidos após teste)

## Configurações

Você pode ajustar as seguintes variáveis:
- `BASE_URL`: URL do servidor (padrão: http://localhost:5000)
- `TEST_USER`: Usuário de teste
- `TEST_MESSAGES`: Array de mensagens para testar
- Delay entre mensagens (padrão: 2 segundos)

## Modo Demo

Os scripts funcionam perfeitamente com o modo demo ativado (`DEMO_MODE=true`), onde qualquer login é aceito automaticamente.

## Troubleshooting

### Erro de Conexão
- Verifique se o servidor está rodando
- Confirme a URL e porta corretas

### Falha de Autenticação
- Verifique se o modo demo está ativado
- Confirme as credenciais de teste

### Respostas Lentas
- Verifique configuração do LightRAG/OpenAI
- Pode estar usando fallback para respostas mock

## Exemplo de Saída

```
🤖 TESTE AUTOMATIZADO DE CHAT - AURALIS
==================================================
📍 URL Base: http://localhost:5000
👤 Usuário de teste: test_user
📨 Total de mensagens: 15

🔐 Fazendo login...
✅ Login bem-sucedido! Usuário: test_user (ADMIN)

🚀 Iniciando teste de múltiplas mensagens...

📤 [1/15] Enviando: "Olá, este é um teste automatizado."
✅ Resposta recebida em 245ms:
   Olá! Bem-vindo ao sistema AURALIS. Como posso ajudá-lo hoje?...

[... mais mensagens ...]

📊 RELATÓRIO DO TESTE
==================================================

📈 Estatísticas Gerais:
   Total de mensagens: 15
   ✅ Bem-sucedidas: 15 (100.0%)
   ❌ Falhas: 0 (0.0%)
   ⏱️  Tempo médio de resposta: 312ms
   📏 Tamanho médio das respostas: 487 caracteres

⚡ Análise de Performance:
   Resposta mais rápida: 198ms
   Resposta mais lenta: 523ms
   Variação: 325ms

✅ Input continua funcionando após múltiplas mensagens!

💾 Relatório salvo em: chat-test-report-1234567890.json

✨ Teste concluído!
```