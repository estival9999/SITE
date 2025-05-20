import { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, SendHorizontal, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

// URL do webhook n8n para o chat
const CHAT_WEBHOOK_URL = "https://mateusestival.app.n8n.cloud/webhook-test/7247896f-761f-4204-ade9-9d609240428b";

export default function KnowledgeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (searchQuery.length < 3) {
      toast({
        title: "Pergunta muito curta",
        description: "Por favor, digite uma pergunta com pelo menos 3 caracteres.",
        variant: "destructive",
      });
      return;
    }

    await sendChatMessage();
  };

  const sendChatMessage = async () => {
    // Limpa respostas e erros anteriores
    setChatResponse(null);
    setError(null);
    setIsChatLoading(true);
    
    try {
      console.log("Enviando consulta para a IA:", searchQuery);
      
      const sessionId = "session-" + Date.now();
      console.log("Session ID gerado:", sessionId);
      
      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pergunta: searchQuery,
          sessionid: sessionId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      // Primeiro tentamos obter o texto bruto da resposta
      const rawText = await response.text();
      console.log("Resposta bruta (texto):", rawText);
      
      // Depois tentamos parsear como JSON se possível
      let data: any;
      try {
        // Se o texto estiver vazio, usamos um objeto vazio para evitar erros
        data = rawText ? JSON.parse(rawText) : {};
      } catch (e) {
        // Se não for JSON válido, usamos o texto bruto como resposta
        console.log("Resposta não é JSON válido, usando texto bruto");
        data = rawText;
      }
      
      console.log("Resposta processada:", data);
      
      // Processamento para formatar a resposta
      let responseText = '';
      
      // Se a resposta for uma string direta
      if (typeof data === 'string') {
        responseText = data;
      }
      // Se for um objeto, tentar extrair a resposta de vários campos possíveis
      else if (data && typeof data === 'object') {
        if (data.resposta) {
          responseText = data.resposta;
        } else if (data.reply) {
          responseText = data.reply;
        } else if (data.response) {
          responseText = data.response;
        } else if (data.output) {
          responseText = data.output;
        } else if (data.answer) {
          responseText = data.answer;
        } else if (data.text) {
          responseText = data.text;
        } else if (data.message) {
          responseText = data.message;
        } else if (data.result) {
          responseText = data.result;
        } else {
          // Se não conseguir extrair em nenhum formato específico, usa o objeto completo
          responseText = JSON.stringify(data);
        }
      }
      
      // Limpeza de formatação para vários cenários possíveis
      
      // Remove { e output do início se existirem
      responseText = responseText.replace(/^\s*\{\s*output:?\s*/i, '');
      responseText = responseText.replace(/^\s*\{\s*"output":?\s*/i, '');
      responseText = responseText.replace(/^\s*{"output":\s*/i, '');
      
      // Remove aspas redundantes e caracteres } no final
      responseText = responseText.replace(/"\s*\}\s*$/g, '');
      responseText = responseText.replace(/\s*\}\s*$/g, '');
      
      // Remove aspas extras no início e fim
      responseText = responseText.replace(/^"/, '').replace(/"$/, '');
      
      // Remove barras invertidas de escape antes das aspas
      responseText = responseText.replace(/\\"/g, '"');
      
      // Remove aspas extras dentro do conteúdo
      if (responseText.startsWith('"') && responseText.endsWith('"')) {
        responseText = responseText.slice(1, -1);
      }
      
      // Remove caracteres de escape Unicode
      responseText = responseText.replace(/\\u(\w{4})/g, (_, hex) => 
        String.fromCharCode(parseInt(hex, 16))
      );
      
      console.log("Resposta final formatada:", responseText);
      
      setChatResponse(responseText || "Não foi possível obter uma resposta.");
    } catch (err) {
      console.error("Erro ao consultar IA:", err);
      setError("Desculpe, não foi possível obter uma resposta no momento. Tente novamente mais tarde.");
      toast({
        title: "Erro na consulta",
        description: "Não foi possível conectar ao serviço de IA.",
        variant: "destructive",
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <AppLayout title="Busca de Conhecimento">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end items-center mb-6">
          <div className="flex items-center bg-blue-900/40 px-4 py-2 rounded-lg border border-blue-800">
            <Bot className="h-5 w-5 text-blue-300 mr-2" />
            <span className="text-sm font-medium text-blue-300">Assistente IA</span>
          </div>
        </div>
        
        <Card className="mb-8 shadow-lg border-[#2a2a3a] overflow-hidden bg-[#1a1a26]">
          <CardContent className="pt-6">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearch} className="group">
                <div className="relative">
                  <Input
                    id="knowledgeSearch"
                    className="pl-5 pr-12 py-7 text-base rounded-xl shadow-inner border-2 border-[#2a2a3a] bg-[#13131d] text-white focus:border-blue-600 transition-all duration-300 placeholder:text-gray-500"
                    placeholder="Faça uma pergunta para a IA..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Button 
                      type="submit"
                      size="sm" 
                      variant="default" 
                      className="h-10 w-10 p-0 rounded-lg bg-blue-700 hover:bg-blue-800 shadow-md transition-all duration-300 group-hover:scale-110"
                      disabled={searchQuery.length < 3 || isChatLoading}
                    >
                      <SendHorizontal className="h-5 w-5 text-white" />
                    </Button>
                  </div>
                </div>
              </form>
              
              <p className="mt-3 text-sm text-blue-400 text-center">
                Faça qualquer pergunta sobre nossa organização e o assistente IA irá responder com base nas informações disponíveis.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Chat interface */}
        <Card className="border border-[#2a2a3a] shadow-lg bg-[#1c1c28]">
          <CardContent className="p-6">
            {error ? (
              <div className="bg-[#331a1e] text-red-300 p-5 rounded-lg border border-red-900">
                <p className="flex items-center"><X className="h-5 w-5 mr-2 text-red-400" />{error}</p>
              </div>
            ) : isChatLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                <p className="text-blue-300 font-medium">Buscando resposta...</p>
                <p className="text-sm text-gray-400 mt-2">Estamos consultando nossa base de conhecimento para trazer a melhor resposta para você.</p>
                <div className="mt-4 bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-900/50 text-xs text-blue-300">
                  Conectando ao serviço de IA através do webhook...
                </div>
              </div>
            ) : chatResponse ? (
              <div className="space-y-6">
                <div className="flex items-start mb-6">
                  <div className="bg-[#1a1a26] border border-[#2a2a3a] p-4 rounded-lg mr-2 max-w-2xl shadow-md">
                    <div className="flex items-center mb-2">
                      <div className="bg-[#13131d] p-1.5 rounded-md mr-2 border border-[#344054] shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-blue-300">Você perguntou:</span>
                    </div>
                    <p className="text-white text-base">{searchQuery}</p>
                  </div>
                </div>
                
                <div className="flex items-start mt-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                  <div className="bg-[#161622] border-2 border-blue-600/50 shadow-xl p-6 rounded-xl w-full max-w-4xl">
                    <div className="flex items-center mb-5 border-b border-[#2a2a3a] pb-4">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg mr-3 shadow-md">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium text-blue-400 text-lg">Assistente IA</span>
                      <div className="ml-auto bg-blue-900/20 px-3 py-1 rounded text-xs text-blue-300 border border-blue-900/50">
                        Gerado em tempo real
                      </div>
                    </div>
                    <div className="prose prose-invert max-w-none text-gray-200 prose-headings:text-blue-300 prose-a:text-blue-400 prose-a:hover:text-blue-300 prose-strong:text-white prose-code:bg-[#13131d] prose-code:text-blue-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-[#2a2a3a] prose-li:marker:text-blue-400 leading-relaxed">
                      <ReactMarkdown>{chatResponse}</ReactMarkdown>
                    </div>
                  </div>
                </div>
                
                <div className="w-full flex justify-center mt-8">
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setChatResponse(null);
                    }}
                    className="bg-[#13131d] hover:bg-[#1e1e2e] text-gray-300 border border-[#2a2a3a] rounded-lg px-4 py-2 transition-colors"
                  >
                    Nova Pergunta
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-[#13131d] p-6 rounded-xl mb-5 border border-[#2a2a3a] shadow-lg">
                  <Bot className="h-16 w-16 text-blue-400" />
                </div>
                <h3 className="text-xl font-medium text-blue-300 mb-3">Assistente de IA</h3>
                <p className="text-gray-400 max-w-md mb-8">
                  Digite sua pergunta na caixa acima para obter respostas inteligentes baseadas nos comunicados e documentos da empresa.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                  {[
                    "Quais são os comunicados mais recentes?",
                    "Qual é a política de férias da empresa?", 
                    "Como funciona o processo de aprovação de despesas?",
                    "Quais são as metas da empresa para este ano?"
                  ].map((sugestao, index) => (
                    <div 
                      key={index} 
                      className="bg-[#1a1a26] p-4 rounded-lg border border-[#2a2a3a] hover:border-blue-700 cursor-pointer hover:shadow-md hover:bg-blue-900/10 transition-all duration-300"
                      onClick={() => {
                        setSearchQuery(sugestao);
                        // Adiciona um pequeno atraso para que a pessoa possa ver que a sugestão foi selecionada
                        setTimeout(() => handleSearch(), 300);
                      }}
                    >
                      <p className="text-sm text-blue-300">"{sugestao}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}