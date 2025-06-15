#!/usr/bin/env python3
"""
Script de teste para verificar múltiplas interações de chat
Testa login automático, envio de múltiplas mensagens e verifica respostas
"""

import json
import time
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Configurações
BASE_URL = "http://localhost:5000"
TEST_USER = {
    "username": "test_user",
    "password": "test123"
}

# Mensagens de teste
TEST_MESSAGES = [
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
]

# Cores ANSI para terminal
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'


class ChatTester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.cookies = ""
        self.results = []
        
    def log(self, message: str, color: str = Colors.RESET):
        """Imprime mensagem colorida no console"""
        print(f"{color}{message}{Colors.RESET}")
        
    def make_request(self, endpoint: str, method: str = "GET", 
                    data: Optional[Dict] = None, headers: Optional[Dict] = None) -> Tuple[int, Dict]:
        """Faz uma requisição HTTP e retorna o código de status e o corpo da resposta"""
        url = f"{self.base_url}{endpoint}"
        
        # Preparar headers
        if headers is None:
            headers = {}
        headers['Content-Type'] = 'application/json'
        if self.cookies:
            headers['Cookie'] = self.cookies
            
        # Preparar dados
        if data:
            data = json.dumps(data).encode('utf-8')
            
        # Criar requisição
        request = urllib.request.Request(url, data=data, headers=headers, method=method)
        
        try:
            response = urllib.request.urlopen(request)
            
            # Extrair cookies
            if 'Set-Cookie' in response.headers:
                self.cookies = response.headers['Set-Cookie'].split(';')[0]
                
            # Ler resposta
            body = json.loads(response.read().decode('utf-8'))
            return response.code, body
            
        except urllib.error.HTTPError as e:
            try:
                body = json.loads(e.read().decode('utf-8'))
            except:
                body = {"error": str(e)}
            return e.code, body
        except Exception as e:
            return 500, {"error": str(e)}
            
    def login(self) -> bool:
        """Realiza login no sistema"""
        self.log("\\n🔐 Fazendo login...", Colors.CYAN)
        
        status, response = self.make_request("/api/login", "POST", TEST_USER)
        
        if status == 200:
            self.log(f"✅ Login bem-sucedido! Usuário: {response.get('username')} ({response.get('role')})", Colors.GREEN)
            return True
        else:
            self.log(f"❌ Falha no login: {response}", Colors.RED)
            return False
            
    def send_message(self, message: str, index: int) -> Dict:
        """Envia uma mensagem para o chat"""
        start_time = time.time()
        
        self.log(f"\\n📤 [{index + 1}/{len(TEST_MESSAGES)}] Enviando: \"{message}\"", Colors.BLUE)
        
        data = {
            "message": message,
            "context": f"Teste automatizado - Mensagem {index + 1}"
        }
        
        status, response = self.make_request("/api/chat", "POST", data)
        elapsed_time = (time.time() - start_time) * 1000  # converter para ms
        
        result = {
            "message": message,
            "success": status == 200,
            "status_code": status,
            "response_time": elapsed_time,
            "timestamp": datetime.now().isoformat()
        }
        
        if status == 200:
            content = response.get('message', {}).get('content', '')
            result["response"] = content
            result["response_length"] = len(content)
            
            self.log(f"✅ Resposta recebida em {elapsed_time:.0f}ms:", Colors.GREEN)
            preview = content[:100] + "..." if len(content) > 100 else content
            self.log(f"   {preview}", Colors.RESET)
        else:
            result["error"] = response.get('message', str(response))
            self.log(f"❌ Erro na resposta ({status}): {result['error']}", Colors.RED)
            
        return result
        
    def run_tests(self):
        """Executa o teste completo"""
        self.log("🤖 TESTE AUTOMATIZADO DE CHAT - AURALIS", Colors.BOLD)
        self.log("=" * 50, Colors.BOLD)
        self.log(f"📍 URL Base: {self.base_url}")
        self.log(f"👤 Usuário de teste: {TEST_USER['username']}")
        self.log(f"📨 Total de mensagens: {len(TEST_MESSAGES)}")
        
        # Login
        if not self.login():
            self.log("\\n❌ Não foi possível fazer login. Abortando teste.", Colors.RED)
            return
            
        # Testar múltiplas mensagens
        self.log("\\n🚀 Iniciando teste de múltiplas mensagens...", Colors.MAGENTA)
        
        for i, message in enumerate(TEST_MESSAGES):
            result = self.send_message(message, i)
            self.results.append(result)
            
            # Delay entre mensagens (2 segundos)
            if i < len(TEST_MESSAGES) - 1:
                self.log("⏳ Aguardando 2 segundos antes da próxima mensagem...", Colors.YELLOW)
                time.sleep(2)
                
        # Teste de persistência
        self.log("\\n🔄 Teste de persistência do input...", Colors.CYAN)
        time.sleep(3)
        
        persistence_result = self.send_message("Teste final - o input ainda funciona?", len(TEST_MESSAGES))
        
        if persistence_result["success"]:
            self.log("✅ Input continua funcionando após múltiplas mensagens!", Colors.GREEN)
        else:
            self.log("❌ Problema detectado com o input após múltiplas mensagens!", Colors.RED)
            
        # Gerar relatório
        self.generate_report()
        
    def generate_report(self):
        """Gera relatório do teste"""
        self.log("\\n📊 RELATÓRIO DO TESTE", Colors.BOLD)
        self.log("=" * 50, Colors.BOLD)
        
        total = len(self.results)
        successful = sum(1 for r in self.results if r["success"])
        failed = total - successful
        
        if successful > 0:
            avg_response_time = sum(r["response_time"] for r in self.results if r["success"]) / successful
            avg_response_length = sum(r.get("response_length", 0) for r in self.results if r["success"]) / successful
        else:
            avg_response_time = 0
            avg_response_length = 0
            
        self.log("\\n📈 Estatísticas Gerais:", Colors.CYAN)
        self.log(f"   Total de mensagens: {total}")
        self.log(f"   ✅ Bem-sucedidas: {successful} ({(successful/total*100):.1f}%)")
        self.log(f"   ❌ Falhas: {failed} ({(failed/total*100):.1f}%)")
        self.log(f"   ⏱️  Tempo médio de resposta: {avg_response_time:.0f}ms")
        self.log(f"   📏 Tamanho médio das respostas: {avg_response_length:.0f} caracteres")
        
        # Mensagens que falharam
        if failed > 0:
            self.log("\\n❌ Mensagens que falharam:", Colors.RED)
            for i, result in enumerate(r for r in self.results if not r["success"]):
                self.log(f"   {i + 1}. \"{result['message']}\"")
                self.log(f"      Erro: {result.get('error', 'Unknown error')}")
                self.log(f"      Status Code: {result['status_code']}")
                
        # Análise de performance
        if successful > 0:
            response_times = [r["response_time"] for r in self.results if r["success"]]
            fastest = min(response_times)
            slowest = max(response_times)
            
            self.log("\\n⚡ Análise de Performance:", Colors.CYAN)
            self.log(f"   Resposta mais rápida: {fastest:.0f}ms")
            self.log(f"   Resposta mais lenta: {slowest:.0f}ms")
            self.log(f"   Variação: {slowest - fastest:.0f}ms")
            
        # Salvar relatório
        report_filename = f"chat-test-report-{int(time.time())}.json"
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "base_url": self.base_url,
            "total_messages": total,
            "successful_messages": successful,
            "failed_messages": failed,
            "avg_response_time": avg_response_time,
            "avg_response_length": avg_response_length,
            "results": self.results
        }
        
        with open(report_filename, 'w') as f:
            json.dump(report_data, f, indent=2)
            
        self.log(f"\\n💾 Relatório salvo em: {report_filename}", Colors.GREEN)
        self.log("\\n✨ Teste concluído!", Colors.BOLD)


if __name__ == "__main__":
    import sys
    
    # Permitir URL customizada via argumento
    base_url = sys.argv[1] if len(sys.argv) > 1 else BASE_URL
    
    tester = ChatTester(base_url)
    tester.run_tests()