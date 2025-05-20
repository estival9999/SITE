import { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, SendHorizontal, Loader2 } from "lucide-react";
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
      
      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pergunta: searchQuery
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Processamento para formatar a resposta
      let responseText = '';
      
      if (data.resposta) {
        // Se o webhook retornar no formato { resposta: "texto" }
        responseText = data.resposta;
      } else if (data.reply) {
        // Formato alternativo que pode ser usado pelo n8n
        responseText = data.reply;
      } else if (data.response) {
        // Outro formato alternativo
        responseText = data.response;
      } else if (data.output) {
        // Para o caso de { output: "texto" }
        responseText = data.output;
      } else {
        // Se não conseguir extrair em nenhum formato específico, usa o objeto completo
        responseText = JSON.stringify(data);
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
      
      console.log("Resposta processada da IA:", responseText);
      
      setChatResponse(responseText);
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Busca de Conhecimento</h2>
          <div className="flex items-center bg-[#f0f8f2] px-4 py-2 rounded-lg border border-[#cbe3d2]">
            <Bot className="h-5 w-5 text-[#5e8c6a] mr-2" />
            <span className="text-sm font-medium text-[#5e8c6a]">Assistente IA</span>
          </div>
        </div>
        
        <Card className="mb-8 shadow-lg border-[#e0e6ed] overflow-hidden">
          <CardContent className="pt-6">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearch} className="group">
                <div className="relative">
                  <Input
                    id="knowledgeSearch"
                    className="pl-5 pr-12 py-7 text-base rounded-xl shadow-inner border-2 border-[#e0e6ed] focus:border-[#5e8c6a] transition-all duration-300"
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
                      className="h-10 w-10 p-0 rounded-full bg-[#5e8c6a] hover:bg-[#4d7358] shadow-md transition-all duration-300 group-hover:scale-110"
                      disabled={searchQuery.length < 3 || isChatLoading}
                    >
                      <SendHorizontal className="h-5 w-5 text-white" />
                    </Button>
                  </div>
                </div>
              </form>
              
              <p className="mt-3 text-sm text-[#88a65e] text-center">
                Faça qualquer pergunta sobre nossa organização e o assistente IA irá responder com base nas informações disponíveis.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Chat interface */}
        <Card className="border border-[#e9f0eb] shadow-lg">
          <CardContent className="p-6">
            {error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-md">
                <p>{error}</p>
              </div>
            ) : isChatLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 text-[#5e8c6a] animate-spin mb-4" />
                <p className="text-gray-600">Buscando resposta...</p>
                <p className="text-sm text-gray-400 mt-2">Estamos consultando nossa base de conhecimento para trazer a melhor resposta para você.</p>
                <div className="mt-4 bg-[#f0f8f2] px-4 py-2 rounded-lg border border-[#cbe3d2] text-xs text-[#5e8c6a]">
                  Conectando ao serviço de IA através do webhook...
                </div>
              </div>
            ) : chatResponse ? (
              <div>
                <div className="flex items-start mb-6">
                  <div className="bg-white border border-[var(--color-border)] p-4 rounded-lg mr-2 max-w-2xl shadow-md">
                    <div className="flex items-center mb-2">
                      <div className="bg-[var(--color-bg-main)] p-1.5 rounded-full mr-2 border border-[var(--color-border)] shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-text-medium)]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text-medium)]">Você perguntou:</span>
                    </div>
                    <p className="text-[var(--color-text-dark)] text-base">{searchQuery}</p>
                  </div>
                </div>
                
                <div className="flex items-start mt-6">
                  <div className="bg-white border-2 border-[var(--color-accent-primary)] shadow-xl p-6 rounded-xl w-full max-w-4xl">
                    <div className="flex items-center mb-4 border-b border-[var(--color-border)] pb-3">
                      <div className="bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] p-2 rounded-full mr-3 shadow-md">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium text-[var(--color-accent-primary)] text-lg">Assistente IA</span>
                    </div>
                    <div className="prose prose-lg max-w-none text-[var(--color-text-dark)] prose-headings:text-[var(--color-accent-primary)] prose-a:text-[var(--color-accent-primary)] prose-a:hover:text-[var(--color-accent-secondary)] prose-strong:text-[var(--color-text-dark)] prose-code:bg-[#f8f9fa] prose-code:text-[var(--color-text-medium)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-[var(--color-border)] leading-relaxed">
                      <ReactMarkdown>{chatResponse}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-[#f0f8f2] p-4 rounded-full mb-5">
                  <Bot className="h-16 w-16 text-[#5e8c6a]" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">Assistente de IA</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  Digite sua pergunta na caixa acima para obter respostas inteligentes baseadas nos comunicados e documentos da empresa.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                  {[
                    "Quais são os comunicados mais recentes?",
                    "Qual é a política de férias da empresa?", 
                    "Como funciona o processo de aprovação de despesas?",
                    "Quais são as metas da empresa para este ano?"
                  ].map((sugestão, index) => (
                    <div 
                      key={index} 
                      className="bg-white p-3 rounded-lg border border-[#e0e6ed] hover:border-[#5e8c6a] cursor-pointer hover:shadow-md transition-all duration-300"
                      onClick={() => {
                        setSearchQuery(sugestão);
                        // Adiciona um pequeno atraso para que a pessoa possa ver que a sugestão foi selecionada
                        setTimeout(() => handleSearch(), 300);
                      }}
                    >
                      <p className="text-sm text-[#4d7358]">"{sugestão}"</p>
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
