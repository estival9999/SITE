import { useEffect, useRef, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import * as markmap from 'markmap-view';
import { Transformer } from 'markmap-lib';

// Transformer para converter markdown em dados para o mapa mental
const transformer = new Transformer();

export default function MindMap() {
  const [inputText, setInputText] = useState(
    "# Mapa Mental\n## Tópico 1\n### Subtópico 1.1\n### Subtópico 1.2\n## Tópico 2\n### Subtópico 2.1\n#### Detalhe 2.1.1\n### Subtópico 2.2"
  );
  const [isLoading, setIsLoading] = useState(false);
  const markmapRef = useRef<HTMLDivElement>(null);
  const markmapInstanceRef = useRef<markmap.Markmap | null>(null);

  // Função para transformar texto indentado em Markdown
  const transformIndentedTextToMarkdown = (text: string): string => {
    const lines = text.split('\n');
    const result: string[] = [];
    
    // Função para contar espaços de indentação no início da linha
    const countIndentation = (line: string): number => {
      const match = line.match(/^(\s+)/);
      return match ? match[1].length : 0;
    };
    
    // Processa cada linha
    lines.forEach(line => {
      if (!line.trim()) {
        result.push('');
        return;
      }
      
      const indentation = countIndentation(line);
      const trimmedLine = line.trim();
      // Converte nível de indentação para nível de cabeçalho markdown
      // Indentação 0 = h1, indentação 2 = h2, etc.
      const headerLevel = Math.min(Math.floor(indentation / 2) + 1, 6);
      result.push(`${'#'.repeat(headerLevel)} ${trimmedLine}`);
    });
    
    return result.join('\n');
  };

  // Função para gerar e renderizar o mapa mental
  const generateMindMap = () => {
    if (!markmapRef.current) return;
    
    setIsLoading(true);
    
    try {
      // Determina se o texto é indentado ou markdown
      const isIndentedText = inputText.split('\n').some(line => /^\s+/.test(line));
      
      // Converte para markdown se necessário
      const markdownText = isIndentedText 
        ? transformIndentedTextToMarkdown(inputText) 
        : inputText;
      
      // Transforma o markdown em dados para o mapa
      const { root } = transformer.transform(markdownText);
      
      // Limpa o conteúdo anterior
      if (markmapRef.current) {
        markmapRef.current.innerHTML = '';
      }
      
      // Cria uma nova instância do markmap
      if (markmapRef.current) {
        markmapInstanceRef.current = markmap.Markmap.create(markmapRef.current, undefined, root);
      }
    } catch (error) {
      console.error('Erro ao gerar o mapa mental:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para zoom
  const zoomIn = () => {
    if (markmapInstanceRef.current) {
      markmapInstanceRef.current.rescale(1.2);
    }
  };

  const zoomOut = () => {
    if (markmapInstanceRef.current) {
      markmapInstanceRef.current.rescale(0.8);
    }
  };

  const resetView = () => {
    if (markmapInstanceRef.current) {
      markmapInstanceRef.current.fit();
    }
  };

  // Gera o mapa inicial na montagem do componente
  useEffect(() => {
    generateMindMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout title="Mapa Mental">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Área de entrada de texto */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--color-accent-primary)]">
              Entrada de Texto
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Digite ou cole seu texto abaixo. Você pode usar indentação com espaços para criar hierarquia ou usar sintaxe Markdown com cabeçalhos (#, ##, ###).
            </p>
            <Textarea
              className="min-h-[300px] font-mono text-sm"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite ou cole o texto para gerar o mapa mental..."
            />
            <div className="mt-4 flex justify-end">
              <Button
                onClick={generateMindMap}
                disabled={isLoading || !inputText.trim()}
                className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-secondary)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Gerar Mapa Mental"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Área de visualização do mapa mental */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[var(--color-accent-primary)]">
                Visualização do Mapa Mental
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                  title="Ampliar"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                  title="Reduzir"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetView}
                  title="Redefinir vista"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg h-[400px] w-full overflow-hidden bg-white">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-[var(--color-accent-primary)] animate-spin" />
                </div>
              ) : (
                <div
                  ref={markmapRef}
                  className="h-full w-full markmap"
                  style={{ minHeight: "400px" }}
                />
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Dica: Clique nos nós para expandir/colapsar. Use os botões acima para ampliar/reduzir e redefinir a vista.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}