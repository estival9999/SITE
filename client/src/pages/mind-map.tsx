import { useCallback, useEffect, useState, useMemo } from "react";
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
  Position,
  MarkerType,
  Handle,
} from 'react-flow-renderer';

// Componente de nó personalizado
const CustomNode = ({ data }: { data: { label: string, level: number } }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-lg bg-[#c4c9ef] border-2 border-[#8c8fd8] text-[#242424] font-medium min-w-[100px] text-center">
      {/* Handle de entrada (lado superior) */}
      {data.level > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-2 h-2 bg-[#8c8fd8]"
        />
      )}
      
      <div>{data.label}</div>
      
      {/* Handle de saída (lado inferior) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-[#8c8fd8]"
      />
    </div>
  );
};

// Registrando o componente de nó personalizado usando useMemo para evitar re-renderizações
function MindMapContent() {
  // Definição de nodeTypes dentro do componente, mas memoizado
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  
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
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Mapa para armazenar os nós por nível e o último nó de cada caminho
    const levelMap: { [key: number]: { id: string, label: string }[] } = {};
    const parentMap: { [key: number]: string } = {}; // Armazena o último pai para cada nível
    
    // Função para determinar o nível de indentação
    const getIndentationLevel = (line: string): number => {
      const indent = line.match(/^(\s+)/);
      return indent ? Math.ceil(indent[0].length / 2) : 0;
    };
    
    let nodeIdCounter = 1;
    
    // Primeiro passo: criar os nós
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      const level = getIndentationLevel(line);
      const nodeId = `node-${nodeIdCounter++}`;
      
      // Calcular posição aproximada - será ajustada depois
      const xPos = level * 250;
      const yPos = newNodes.filter(n => n.data.level === level).length * 100;
      
      // Criar o nó
      const newNode: Node = {
        id: nodeId,
        type: 'custom',
        data: { 
          label: trimmedLine,
          level: level
        },
        position: { x: xPos, y: yPos },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
      
      newNodes.push(newNode);
      
      // Rastrear nós por nível
      if (!levelMap[level]) levelMap[level] = [];
      levelMap[level].push({ id: nodeId, label: trimmedLine });
      
      // Conectar ao pai apropriado
      if (level > 0) {
        const parentLevel = level - 1;
        const parentId = parentMap[parentLevel];
        
        if (parentId) {
          const edgeId = `edge-${parentId}-${nodeId}`;
          const newEdge: Edge = {
            id: edgeId,
            source: parentId,
            target: nodeId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#8c8fd8', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#8c8fd8',
              width: 20,
              height: 20,
            },
          };
          
          newEdges.push(newEdge);
        }
      }
      
      // Atualizar o mapa de pais para este nível
      parentMap[level] = nodeId;
      
      // Limpar os mapas de pais para níveis mais profundos
      for (let i = level + 1; i < Object.keys(levelMap).length; i++) {
        delete parentMap[i];
      }
    });
    
    // Segundo passo: organizar os nós em um layout radial
    if (newNodes.length > 0) {
      // Encontrar o nó raiz (nível 0)
      const rootNode = newNodes.find(node => node.data.level === 0);
      
      if (rootNode) {
        // Posicionar o nó raiz no centro
        rootNode.position = { x: 0, y: 0 };
        
        // Posicionar filhos de primeiro nível em círculo ao redor do nó raiz
        const firstLevelNodes = newNodes.filter(node => node.data.level === 1);
        const angleStep = (2 * Math.PI) / firstLevelNodes.length;
        
        firstLevelNodes.forEach((node, index) => {
          const angle = index * angleStep;
          const radius = 200;
          
          node.position = {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          };
          
          // Posicionar os filhos do segundo nível
          positionChildrenNodes(node, newNodes, newEdges, radius, angle, angleStep);
        });
      }
    }
    
    return { nodes: newNodes, edges: newEdges };
  }, []);
  
  // Função para posicionar os nós filhos
  const positionChildrenNodes = (
    parentNode: Node,
    allNodes: Node[],
    allEdges: Edge[],
    parentRadius: number,
    parentAngle: number,
    parentAngleWidth: number
  ) => {
    // Encontrar os filhos deste nó
    const childEdges = allEdges.filter(edge => edge.source === parentNode.id);
    if (childEdges.length === 0) return;
    
    const childNodes = childEdges.map(edge => 
      allNodes.find(node => node.id === edge.target)
    ).filter(Boolean) as Node[];
    
    const childAngleStep = parentAngleWidth / (childNodes.length + 1);
    const childStartAngle = parentAngle - (parentAngleWidth / 2);
    const childRadius = parentRadius * 0.8; // Reduzir o raio conforme aumenta a profundidade
    
    childNodes.forEach((childNode, index) => {
      const childAngle = childStartAngle + ((index + 1) * childAngleStep);
      
      childNode.position = {
        x: parentNode.position.x + Math.cos(childAngle) * childRadius,
        y: parentNode.position.y + Math.sin(childAngle) * childRadius,
      };
      
      // Recursivamente posicionar filhos deste nó
      positionChildrenNodes(
        childNode,
        allNodes,
        allEdges,
        childRadius,
        childAngle,
        childAngleStep * 0.8
      );
    });
  };

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
                    nodeStrokeColor={() => '#8c8fd8'}
                    nodeColor={() => '#c4c9ef'}
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

// Componente principal do mapa mental com o Provider
export default function MindMap() {
  return (
    <ReactFlowProvider>
      <MindMapContent />
    </ReactFlowProvider>
  );
}