import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'react-flow-renderer';

// Componente de nó personalizado
const CustomNode = ({ data }: { data: { label: string } }) => {
  return (
    <div className="px-4 py-2 rounded-lg shadow-md bg-[#c4c9ef] border-2 border-[#8c8fd8] text-[#242424] font-medium">
      {data.label}
    </div>
  );
};

// Registrando o componente de nó personalizado
const nodeTypes = {
  custom: CustomNode,
};

// Componente principal do mapa mental
export default function MindMap() {
  return (
    <ReactFlowProvider>
      <MindMapContent />
    </ReactFlowProvider>
  );
}

function MindMapContent() {
  const [inputText, setInputText] = useState(
    "Pick a Mind Map Tool\n  Cost\n    Price of the App\n    Develop a Habit With the App\n  Platform\n    Which OS you Use?\n    Nature of Work\n  Needs\n    Goal of Creating a Mind Map\n    Individual or Team Use\n  Collaboration\n    Do you Collaborate With Team on Mind Maps?\n    Number of Team Members\n  Templates\n    Built-in Templates\n    Use Cases\n  Import/Export\n    Import and Export Formats\n    Is the Feature Behind Paywall or Integrate With Other Apps"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, zoomIn: reactFlowZoomIn, zoomOut: reactFlowZoomOut } = useReactFlow();

  // Função para processar o texto indentado
  const processIndentedText = useCallback((text: string) => {
    const lines = text.split('\n');
    const rootNodes: Array<Node> = [];
    const edgesList: Array<Edge> = [];
    
    // Mapeamento para rastrear níveis e nós
    const levelMap: { [key: number]: string[] } = {};
    let nodeId = 1;
    let mainThemeId = '';

    // Função para determinar o nível de indentação
    const getIndentationLevel = (line: string): number => {
      const indent = line.match(/^(\s+)/);
      return indent ? Math.ceil(indent[0].length / 2) : 0;
    };

    // Primeira passagem: criar todos os nós
    lines.forEach((line, index) => {
      if (!line.trim()) return;

      const level = getIndentationLevel(line);
      const nodeLabel = line.trim();
      const id = `node-${nodeId++}`;

      // Adicionar ao mapa de níveis para rastrear a hierarquia
      if (!levelMap[level]) {
        levelMap[level] = [];
      }
      levelMap[level].push(id);

      // Salvar o ID do tema principal (primeiro nó)
      if (level === 0 && !mainThemeId) {
        mainThemeId = id;
      }

      // Criar o nó com posição inicial
      // Posições serão calculadas depois
      const node: Node = {
        id,
        type: 'custom',
        data: { label: nodeLabel },
        position: { x: 0, y: 0 },
      };

      rootNodes.push(node);
    });

    // Calcular posições de nós em layout radial
    const calculatePositions = (nodesList: Node[], edgesList: Edge[]): void => {
      // Posicionar o nó principal no centro
      if (nodesList.length > 0) {
        const mainNode = nodesList.find(n => n.id === mainThemeId);
        if (mainNode) {
          mainNode.position = { x: 0, y: 0 };
        }
      }

      // Funções para cálculos de posição baseadas no layout radial
      const getMainBranches = (): Node[] => {
        return nodesList.filter(node => {
          // Encontrar nós conectados diretamente ao nó central
          // mas apenas se são pais de outros nós (estão no nível 1)
          return edgesList.some(edge => 
            edge.source === mainThemeId && 
            edge.target === node.id &&
            levelMap[1]?.includes(node.id)
          );
        });
      };

      // Posicionar os ramos principais em círculo ao redor do nó central
      const mainBranches = getMainBranches();
      const angleStep = (2 * Math.PI) / mainBranches.length;
      mainBranches.forEach((node, index) => {
        const angle = index * angleStep;
        const radius = 200; // Distância do centro
        
        node.position = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };

        // Agora, para cada ramo principal, posicionar seus filhos
        positionChildNodes(node, radius / 2, angle, 0.5, edgesList, nodesList);
      });
    };

    // Função recursiva para posicionar nós filhos
    const positionChildNodes = (
      parentNode: Node, 
      radius: number, 
      parentAngle: number, 
      angleSpread: number, 
      edges: Edge[], 
      nodes: Node[]
    ): void => {
      // Encontrar todos os nós filhos deste pai
      const childrenEdges = edges.filter(edge => edge.source === parentNode.id);
      if (childrenEdges.length === 0) return;

      const childAngleStep = angleSpread / childrenEdges.length;
      const startAngle = parentAngle - (angleSpread / 2);

      childrenEdges.forEach((edge, index) => {
        const childNode = nodes.find(n => n.id === edge.target);
        if (!childNode) return;

        const childAngle = startAngle + (index * childAngleStep);
        const grandchildRadius = radius * 0.8; // Diminui gradualmente o raio para os níveis mais profundos
        
        childNode.position = {
          x: parentNode.position.x + Math.cos(childAngle) * radius,
          y: parentNode.position.y + Math.sin(childAngle) * radius,
        };

        // Continuar recursivamente para os filhos deste nó
        positionChildNodes(childNode, grandchildRadius, childAngle, childAngleStep, edges, nodes);
      });
    };

    // Segunda passagem: criar as arestas (conexões)
    for (let level = 0; level < Object.keys(levelMap).length; level++) {
      if (!levelMap[level]) continue;
      
      // Para cada nó neste nível
      levelMap[level].forEach(nodeId => {
        // Se houver um próximo nível, conecte este nó aos nós filho apropriados
        if (levelMap[level + 1]) {
          // Determinar qual parte do texto corresponde a este nó
          const nodeIndex = rootNodes.findIndex(n => n.id === nodeId);
          if (nodeIndex === -1) return;
          
          const currentLine = lines[nodeIndex];
          const currentIndent = getIndentationLevel(currentLine);
          
          // Procurar os filhos deste nó (próximas linhas com indent + 1)
          for (let i = nodeIndex + 1; i < lines.length; i++) {
            const nextLine = lines[i];
            const nextIndent = getIndentationLevel(nextLine);
            
            // Se a indentação for menor ou igual, não é filho
            if (nextIndent <= currentIndent) break;
            
            // Se a indentação for exatamente um nível mais profundo, é filho direto
            if (nextIndent === currentIndent + 1) {
              const childNodeId = rootNodes[i]?.id;
              if (childNodeId) {
                const edge: Edge = {
                  id: `edge-${nodeId}-${childNodeId}`,
                  source: nodeId,
                  target: childNodeId,
                  style: { stroke: '#8c8fd8', strokeWidth: 2 },
                  type: 'smoothstep',
                  animated: false,
                };
                edgesList.push(edge);
              }
            }
          }
        }
      });
    }

    // Calcular posições para um layout radial
    calculatePositions(rootNodes, edgesList);

    return { nodes: rootNodes, edges: edgesList };
  }, []);

  // Função para gerar o mapa mental
  const generateMindMap = useCallback(() => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Processar o texto indentado para criar nós e arestas
      const { nodes: newNodes, edges: newEdges } = processIndentedText(inputText);
      
      // Atualizar o estado
      setNodes(newNodes);
      setEdges(newEdges);
      
      // Ajustar a visualização para enquadrar todos os nós
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 100);
    } catch (error) {
      console.error('Erro ao gerar o mapa mental:', error);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, processIndentedText, setNodes, setEdges, fitView]);

  // Gerar o mapa inicial quando o componente for montado
  useEffect(() => {
    generateMindMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout title="Mapa Mental">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de entrada de texto */}
        <Card className="shadow-lg lg:col-span-1">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--color-accent-primary)]">
              Entrada de Texto
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Digite ou cole seu texto abaixo. Use indentação com espaços para criar a hierarquia do mapa mental.
            </p>
            <Textarea
              className="min-h-[300px] font-mono text-sm"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite ou cole o texto indentado para gerar o mapa mental..."
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

        {/* Área de visualização do mapa */}
        <Card className="shadow-lg lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[var(--color-accent-primary)]">
                Visualização do Mapa Mental
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reactFlowZoomIn()}
                  title="Ampliar"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reactFlowZoomOut()}
                  title="Reduzir"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fitView()}
                  title="Reajustar visualização"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg h-[500px] w-full overflow-hidden bg-white">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-[var(--color-accent-primary)] animate-spin" />
                </div>
              ) : (
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  connectionLineType={ConnectionLineType.SmoothStep}
                  defaultZoom={0.8}
                  minZoom={0.2}
                  maxZoom={1.5}
                  attributionPosition="bottom-left"
                  fitView
                >
                  <Controls />
                  <Background color="#aaa" gap={16} />
                  <MiniMap
                    nodeStrokeColor={(n) => {
                      return '#8c8fd8';
                    }}
                    nodeColor={(n) => {
                      return '#c4c9ef';
                    }}
                    nodeBorderRadius={10}
                  />
                </ReactFlow>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Dica: Arraste o mapa para mover, use o scroll ou os botões para zoom, e arraste os nós para organizar.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}