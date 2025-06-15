#!/bin/bash

# Script de teste para verificar múltiplas interações de chat usando curl
# Testa login automático, envio de múltiplas mensagens e verifica respostas

# Configurações
BASE_URL="${BASE_URL:-http://localhost:5000}"
TEST_USER="test_user"
TEST_PASSWORD="test123"
COOKIE_FILE="test-cookies.txt"
LOG_FILE="chat-test-$(date +%Y%m%d_%H%M%S).log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Mensagens de teste
declare -a TEST_MESSAGES=(
    "Olá, este é um teste automatizado."
    "Como posso criar um novo comunicado?"
    "Quais são as categorias disponíveis?"
    "Explique o que é o sistema AURALIS."
    "Como faço para visualizar comunicados antigos?"
    "Qual a diferença entre usuário ADMIN e READER?"
    "Posso anexar arquivos aos comunicados?"
    "Como funciona o sistema de perguntas?"
    "O que é o mapa mental?"
    "Como busco por comunicados específicos?"
    "Existem filtros disponíveis na busca?"
    "Como marco um comunicado como lido?"
    "Posso exportar relatórios?"
    "Como altero minha senha?"
    "O sistema tem API REST?"
)

# Contadores
SUCCESS_COUNT=0
FAIL_COUNT=0
TOTAL_TIME=0

# Função para log
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Função para fazer login
login() {
    log "${CYAN}\\n🔐 Fazendo login...${NC}"
    
    RESPONSE=$(curl -s -w "\\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASSWORD\"}" \
        -c "$COOKIE_FILE" \
        "$BASE_URL/api/login")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        log "${GREEN}✅ Login bem-sucedido!${NC}"
        log "Resposta: $BODY"
        return 0
    else
        log "${RED}❌ Falha no login. HTTP Code: $HTTP_CODE${NC}"
        log "Resposta: $BODY"
        return 1
    fi
}

# Função para enviar mensagem
send_message() {
    local MESSAGE="$1"
    local INDEX="$2"
    local TOTAL="${#TEST_MESSAGES[@]}"
    
    log "${BLUE}\\n📤 [$((INDEX + 1))/$TOTAL] Enviando: \"$MESSAGE\"${NC}"
    
    # Medir tempo de resposta
    START_TIME=$(date +%s%N)
    
    RESPONSE=$(curl -s -w "\\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "{\"message\":\"$MESSAGE\",\"context\":\"Teste automatizado - Mensagem $((INDEX + 1))\"}" \
        -b "$COOKIE_FILE" \
        "$BASE_URL/api/chat")
    
    END_TIME=$(date +%s%N)
    ELAPSED_TIME=$(( (END_TIME - START_TIME) / 1000000 )) # Converter para ms
    TOTAL_TIME=$((TOTAL_TIME + ELAPSED_TIME))
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        log "${GREEN}✅ Resposta recebida em ${ELAPSED_TIME}ms${NC}"
        
        # Extrair conteúdo da resposta (primeiros 100 caracteres)
        CONTENT=$(echo "$BODY" | jq -r '.message.content' 2>/dev/null | head -c 100)
        if [ -n "$CONTENT" ]; then
            log "   ${CONTENT}..."
        fi
        return 0
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        log "${RED}❌ Erro na resposta. HTTP Code: $HTTP_CODE${NC}"
        log "Resposta: $BODY"
        return 1
    fi
}

# Função para gerar relatório
generate_report() {
    local TOTAL=$((SUCCESS_COUNT + FAIL_COUNT))
    local AVG_TIME=$((TOTAL_TIME / TOTAL))
    local SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($SUCCESS_COUNT/$TOTAL)*100}")
    
    log "${MAGENTA}\\n📊 RELATÓRIO DO TESTE${NC}"
    log "=================================================="
    log "\\n📈 Estatísticas Gerais:"
    log "   Total de mensagens: $TOTAL"
    log "   ✅ Bem-sucedidas: $SUCCESS_COUNT ($SUCCESS_RATE%)"
    log "   ❌ Falhas: $FAIL_COUNT"
    log "   ⏱️  Tempo médio de resposta: ${AVG_TIME}ms"
    log "   📅 Timestamp: $(date)"
    log "\\n💾 Log completo salvo em: $LOG_FILE"
}

# Função principal
main() {
    log "${MAGENTA}🤖 TESTE AUTOMATIZADO DE CHAT - AURALIS${NC}"
    log "=================================================="
    log "📍 URL Base: $BASE_URL"
    log "👤 Usuário de teste: $TEST_USER"
    log "📨 Total de mensagens: ${#TEST_MESSAGES[@]}"
    
    # Verificar dependências
    if ! command -v curl &> /dev/null; then
        log "${RED}❌ curl não está instalado!${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log "${YELLOW}⚠️  jq não está instalado. Algumas funcionalidades podem ser limitadas.${NC}"
    fi
    
    # Limpar cookies anteriores
    rm -f "$COOKIE_FILE"
    
    # Fazer login
    if ! login; then
        log "${RED}\\n❌ Não foi possível fazer login. Abortando teste.${NC}"
        exit 1
    fi
    
    # Testar múltiplas mensagens
    log "${MAGENTA}\\n🚀 Iniciando teste de múltiplas mensagens...${NC}"
    
    for i in "${!TEST_MESSAGES[@]}"; do
        send_message "${TEST_MESSAGES[$i]}" "$i"
        
        # Delay entre mensagens (2 segundos)
        if [ $i -lt $((${#TEST_MESSAGES[@]} - 1)) ]; then
            log "${YELLOW}⏳ Aguardando 2 segundos antes da próxima mensagem...${NC}"
            sleep 2
        fi
    done
    
    # Teste de persistência
    log "${CYAN}\\n🔄 Teste de persistência do input...${NC}"
    sleep 3
    
    if send_message "Teste final - o input ainda funciona?" "${#TEST_MESSAGES[@]}"; then
        log "${GREEN}✅ Input continua funcionando após múltiplas mensagens!${NC}"
    else
        log "${RED}❌ Problema detectado com o input após múltiplas mensagens!${NC}"
    fi
    
    # Gerar relatório
    generate_report
    
    # Limpar cookies
    rm -f "$COOKIE_FILE"
    
    log "${GREEN}\\n✨ Teste concluído!${NC}"
}

# Executar teste
main