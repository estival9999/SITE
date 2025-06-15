#!/usr/bin/env python3
"""
Script de teste para verificar múltiplas interações no chat
Testa se o input continua funcionando após várias mensagens
"""

import requests
import time
import json
from datetime import datetime

# Configuração
BASE_URL = "http://localhost:5000"
TEST_USER = "admin"
TEST_PASS = "admin"
NUM_MESSAGES = 15

# Cores ANSI
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_status(message, status="info"):
    colors = {"success": GREEN, "error": RED, "warning": YELLOW, "info": BLUE}
    color = colors.get(status, BLUE)
    print(f"{color}[{datetime.now().strftime('%H:%M:%S')}] {message}{RESET}")

def login():
    """Faz login no sistema"""
    print_status("Fazendo login...", "info")
    
    response = requests.post(
        f"{BASE_URL}/api/login",
        json={"username": TEST_USER, "password": TEST_PASS}
    )
    
    if response.status_code == 200:
        print_status(f"Login bem-sucedido: {response.json()['username']}", "success")
        return response.cookies
    else:
        print_status(f"Erro no login: {response.status_code}", "error")
        return None

def send_chat_message(message, cookies, message_num):
    """Envia uma mensagem para o chat"""
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": message},
            cookies=cookies,
            timeout=30
        )
        
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            assistant_response = data.get('message', {}).get('content', 'Sem resposta')
            
            # Truncar resposta longa
            if len(assistant_response) > 100:
                assistant_response = assistant_response[:100] + "..."
            
            print_status(
                f"Mensagem {message_num}: ✓ ({elapsed_time:.2f}s) - {assistant_response[:50]}...",
                "success"
            )
            return True
        else:
            print_status(
                f"Mensagem {message_num}: ✗ Status {response.status_code}",
                "error"
            )
            return False
    except Exception as e:
        print_status(
            f"Mensagem {message_num}: ✗ Erro: {str(e)}",
            "error"
        )
        return False

def main():
    print(f"{BLUE}{'='*60}")
    print(f"TESTE DE MÚLTIPLAS INTERAÇÕES - CHAT AURALIS")
    print(f"{'='*60}{RESET}\n")
    
    # Login
    cookies = login()
    # Continuar mesmo se cookies estiver vazio (modo demo aceita qualquer coisa)
    
    print_status(f"\nIniciando teste com {NUM_MESSAGES} mensagens...\n", "info")
    
    # Mensagens de teste variadas
    test_messages = [
        "Olá, você está funcionando?",
        "Me conte sobre o sistema AURALIS",
        "Quais são os comunicados mais recentes?",
        "Como posso criar um novo comunicado?",
        "Qual é a diferença entre ADMIN e READER?",
        "Existem metas para este trimestre?",
        "Como funciona o sistema de perguntas?",
        "Posso anexar arquivos aos comunicados?",
        "Quais departamentos estão cadastrados?",
        "Como altero minha senha?",
        "Existe limite de caracteres nas mensagens?",
        "O sistema tem API REST?",
        "Como faço backup dos dados?",
        "Quais são as boas práticas do sistema?",
        "Você ainda está respondendo após várias mensagens?"
    ]
    
    # Estatísticas
    successful = 0
    failed = 0
    total_time = 0
    
    # Enviar mensagens
    for i in range(NUM_MESSAGES):
        message = test_messages[i % len(test_messages)]
        print_status(f"Enviando: '{message}'", "info")
        
        start = time.time()
        success = send_chat_message(message, cookies, i + 1)
        elapsed = time.time() - start
        
        if success:
            successful += 1
        else:
            failed += 1
        
        total_time += elapsed
        
        # Delay entre mensagens
        if i < NUM_MESSAGES - 1:
            time.sleep(2)
    
    # Relatório final
    print(f"\n{BLUE}{'='*60}")
    print(f"RELATÓRIO FINAL")
    print(f"{'='*60}{RESET}")
    
    success_rate = (successful / NUM_MESSAGES) * 100
    avg_time = total_time / NUM_MESSAGES
    
    print_status(f"Mensagens enviadas: {NUM_MESSAGES}", "info")
    print_status(f"Bem-sucedidas: {successful} ({success_rate:.1f}%)", "success")
    print_status(f"Falhas: {failed}", "error" if failed > 0 else "success")
    print_status(f"Tempo médio: {avg_time:.2f}s", "info")
    print_status(f"Tempo total: {total_time:.2f}s", "info")
    
    # Teste final - verificar se ainda funciona
    print(f"\n{YELLOW}Teste final: Verificando se o chat ainda responde...{RESET}")
    final_test = send_chat_message("Teste final - você ainda está funcionando?", cookies, "FINAL")
    
    if final_test:
        print_status("\n✅ SUCESSO: Chat continua funcionando após múltiplas interações!", "success")
    else:
        print_status("\n❌ FALHA: Chat parou de funcionar!", "error")
    
    # Salvar resultados
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_messages": NUM_MESSAGES,
        "successful": successful,
        "failed": failed,
        "success_rate": success_rate,
        "avg_response_time": avg_time,
        "final_test_passed": final_test
    }
    
    with open("chat-test-results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print_status("\nResultados salvos em chat-test-results.json", "info")

if __name__ == "__main__":
    main()