#!/usr/bin/env node

/**
 * Script de teste para verificar múltiplas interações de chat
 * Testa login automático, envio de múltiplas mensagens e verifica respostas
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configurações
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEST_USER = {
  username: 'test_user',
  password: 'test123'
};

// Mensagens de teste
const TEST_MESSAGES = [
  "Olá, este é um teste automatizado.",
  "Como posso criar um novo comunicado?",
  "Quais são as categorias disponíveis?",
  "Explique o que é o sistema AURALIS.",
  "Como faço para visualizar comunicados antigos?",
  "Qual a diferença entre usuário ADMIN e READER?",
  "Posso anexar arquivos aos comunicados?",
  "Como funciona o sistema de perguntas?",
  "O que é o mapa mental?",
  "Como busco por comunicados específicos?",
  "Existem filtros disponíveis na busca?",
  "Como marco um comunicado como lido?",
  "Posso exportar relatórios?",
  "Como altero minha senha?",
  "O sistema tem API REST?"
];

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper para logs coloridos
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper para delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Cookie storage (simula sessão)
let cookies = '';

// Função para extrair cookies da resposta
function extractCookies(response) {
  const setCookieHeader = response.headers.raw()['set-cookie'];
  if (setCookieHeader) {
    cookies = setCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
  }
}

// Função para fazer login
async function login() {
  log('\\n🔐 Fazendo login...', 'cyan');
  
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });

    extractCookies(response);
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ Login bem-sucedido! Usuário: ${data.username} (${data.role})`, 'green');
      return data;
    } else {
      const error = await response.text();
      log(`❌ Falha no login: ${error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Erro ao fazer login: ${error.message}`, 'red');
    return null;
  }
}

// Função para enviar mensagem de chat
async function sendChatMessage(message, messageIndex) {
  const startTime = Date.now();
  
  try {
    log(`\\n📤 [${messageIndex + 1}/${TEST_MESSAGES.length}] Enviando: "${message}"`, 'blue');
    
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        message: message,
        context: `Teste automatizado - Mensagem ${messageIndex + 1}`
      })
    });

    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      const responseContent = data.message.content;
      
      log(`✅ Resposta recebida em ${responseTime}ms:`, 'green');
      log(`   ${responseContent.substring(0, 100)}${responseContent.length > 100 ? '...' : ''}`, 'reset');
      
      return {
        success: true,
        responseTime,
        responseLength: responseContent.length,
        message: message,
        response: responseContent
      };
    } else {
      const error = await response.text();
      log(`❌ Erro na resposta (${response.status}): ${error}`, 'red');
      
      return {
        success: false,
        responseTime,
        error: error,
        message: message,
        statusCode: response.status
      };
    }
  } catch (error) {
    log(`❌ Erro ao enviar mensagem: ${error.message}`, 'red');
    
    return {
      success: false,
      responseTime: Date.now() - startTime,
      error: error.message,
      message: message
    };
  }
}

// Função para testar múltiplas mensagens
async function testMultipleMessages() {
  log('\\n🚀 Iniciando teste de múltiplas mensagens...', 'magenta');
  
  const results = [];
  const delayBetweenMessages = 2000; // 2 segundos entre mensagens
  
  for (let i = 0; i < TEST_MESSAGES.length; i++) {
    const result = await sendChatMessage(TEST_MESSAGES[i], i);
    results.push(result);
    
    // Delay entre mensagens (exceto após a última)
    if (i < TEST_MESSAGES.length - 1) {
      log(`⏳ Aguardando ${delayBetweenMessages / 1000} segundos antes da próxima mensagem...`, 'yellow');
      await delay(delayBetweenMessages);
    }
  }
  
  return results;
}

// Função para gerar relatório
function generateReport(results) {
  log('\\n📊 RELATÓRIO DO TESTE', 'bright');
  log('=' .repeat(50), 'bright');
  
  const totalMessages = results.length;
  const successfulMessages = results.filter(r => r.success).length;
  const failedMessages = results.filter(r => !r.success).length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / totalMessages;
  const avgResponseLength = results.filter(r => r.success).reduce((sum, r) => sum + r.responseLength, 0) / successfulMessages || 0;
  
  log(`\\n📈 Estatísticas Gerais:`, 'cyan');
  log(`   Total de mensagens: ${totalMessages}`);
  log(`   ✅ Bem-sucedidas: ${successfulMessages} (${((successfulMessages / totalMessages) * 100).toFixed(1)}%)`);
  log(`   ❌ Falhas: ${failedMessages} (${((failedMessages / totalMessages) * 100).toFixed(1)}%)`);
  log(`   ⏱️  Tempo médio de resposta: ${avgResponseTime.toFixed(0)}ms`);
  log(`   📏 Tamanho médio das respostas: ${avgResponseLength.toFixed(0)} caracteres`);
  
  if (failedMessages > 0) {
    log(`\\n❌ Mensagens que falharam:`, 'red');
    results.filter(r => !r.success).forEach((result, index) => {
      log(`   ${index + 1}. "${result.message}"`);
      log(`      Erro: ${result.error}`);
      if (result.statusCode) {
        log(`      Status Code: ${result.statusCode}`);
      }
    });
  }
  
  // Análise de performance
  log(`\\n⚡ Análise de Performance:`, 'cyan');
  const fastestResponse = Math.min(...results.map(r => r.responseTime));
  const slowestResponse = Math.max(...results.map(r => r.responseTime));
  log(`   Resposta mais rápida: ${fastestResponse}ms`);
  log(`   Resposta mais lenta: ${slowestResponse}ms`);
  log(`   Variação: ${slowestResponse - fastestResponse}ms`);
  
  // Salvar relatório em arquivo
  const reportData = {
    timestamp: new Date().toISOString(),
    totalMessages,
    successfulMessages,
    failedMessages,
    avgResponseTime,
    avgResponseLength,
    fastestResponse,
    slowestResponse,
    results: results.map(r => ({
      message: r.message,
      success: r.success,
      responseTime: r.responseTime,
      responseLength: r.responseLength || 0,
      error: r.error
    }))
  };
  
  const reportPath = path.join(__dirname, `chat-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`\\n💾 Relatório salvo em: ${reportPath}`, 'green');
}

// Função principal
async function main() {
  log('🤖 TESTE AUTOMATIZADO DE CHAT - AURALIS', 'bright');
  log('=' .repeat(50), 'bright');
  log(`📍 URL Base: ${BASE_URL}`);
  log(`👤 Usuário de teste: ${TEST_USER.username}`);
  log(`📨 Total de mensagens: ${TEST_MESSAGES.length}`);
  
  // Fazer login
  const user = await login();
  if (!user) {
    log('\\n❌ Não foi possível fazer login. Abortando teste.', 'red');
    process.exit(1);
  }
  
  // Testar múltiplas mensagens
  const results = await testMultipleMessages();
  
  // Gerar relatório
  generateReport(results);
  
  // Teste de persistência - enviar uma última mensagem após todas as outras
  log('\\n🔄 Teste de persistência do input...', 'cyan');
  await delay(3000);
  const persistenceTest = await sendChatMessage("Teste final - o input ainda funciona?", TEST_MESSAGES.length);
  
  if (persistenceTest.success) {
    log('✅ Input continua funcionando após múltiplas mensagens!', 'green');
  } else {
    log('❌ Problema detectado com o input após múltiplas mensagens!', 'red');
  }
  
  log('\\n✨ Teste concluído!', 'bright');
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  log(`\\n❌ Erro não tratado: ${error}`, 'red');
  process.exit(1);
});

// Executar teste
main().catch(error => {
  log(`\\n❌ Erro fatal: ${error}`, 'red');
  process.exit(1);
});