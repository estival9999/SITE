import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Announcement, Category, Department } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Loader2, Info, RefreshCw, AlertTriangle, X, Check, FileText, Trash2 } from "lucide-react";

interface AnnouncementCardProps {
  announcement: Announcement;
  isAdmin: boolean;
  isCreator: boolean;
}

export default function AnnouncementCard({ announcement, isAdmin, isCreator }: AnnouncementCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [readStatus, setReadStatus] = useState<boolean>(false); // This would come from API in a real implementation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get department and category specific styling
  const getDepartmentClass = () => {
    switch (announcement.department) {
      case Department.CONTROLES_INTERNOS:
        return "department-controles border-l-4 border-red-500";
      case Department.ADMINISTRATIVO:
        return "department-administrativo border-l-4 border-blue-500";
      case Department.CICLO_DE_CREDITO:
        return "department-credito border-l-4 border-green-500";
      default:
        return "";
    }
  };

  const getDepartmentBadgeClass = () => {
    switch (announcement.department) {
      case Department.CONTROLES_INTERNOS:
        return "bg-red-500 text-white";
      case Department.ADMINISTRATIVO:
        return "bg-blue-500 text-white";
      case Department.CICLO_DE_CREDITO:
        return "bg-green-500 text-white";
      default:
        return "";
    }
  };

  const getDepartmentLabel = () => {
    switch (announcement.department) {
      case Department.CONTROLES_INTERNOS:
        return "Controles Internos";
      case Department.ADMINISTRATIVO:
        return "Administrativo";
      case Department.CICLO_DE_CREDITO:
        return "Ciclo de Crédito";
      default:
        return "";
    }
  };

  const getCategoryIcon = () => {
    switch (announcement.category) {
      case Category.INFORMATIVO:
        return <Info className="h-3 w-3 text-gray-600" />;
      case Category.ATUALIZACAO:
        return <RefreshCw className="h-3 w-3 text-gray-600" />;
      case Category.DETERMINACAO:
        return <AlertTriangle className="h-3 w-3 text-gray-600" />;
      default:
        return <Info className="h-3 w-3 text-gray-600" />;
    }
  };

  const getCategoryTitle = () => {
    switch (announcement.category) {
      case Category.INFORMATIVO:
        return "Informativo";
      case Category.ATUALIZACAO:
        return "Atualização";
      case Category.DETERMINACAO:
        return "Determinação";
      default:
        return "";
    }
  };

  // Toggle read status mutation
  const toggleReadStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/announcements/${announcement.id}/read-status`, {
        isRead: !readStatus,
      });
      return await res.json();
    },
    onSuccess: () => {
      setReadStatus(!readStatus);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/announcements/${announcement.id}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Comunicado Excluído",
        description: "O comunicado foi excluído com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Ask question mutation
  const askQuestionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/announcements/${announcement.id}/questions`, {
        text: question,
        askerId: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pergunta Enviada",
        description: "Sua pergunta foi enviada com sucesso!",
        variant: "default",
      });
      setQuestion("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar pergunta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on read flag or delete button
    if (
      e.target instanceof Element &&
      (e.target.closest(".read-flag") || e.target.closest(".delete-announcement"))
    ) {
      return;
    }

    setIsExpanded(!isExpanded);
    
    // Mark as read if expanding and not already read
    if (!isExpanded && !readStatus) {
      toggleReadStatusMutation.mutate();
    }
  };

  const handleReadFlagClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion
    
    // Animação suave de transição eliminada para uma melhor abordagem via CSS
    
    toggleReadStatusMutation.mutate();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion
    setShowDeleteConfirm(true);
  };

  const handleAskQuestion = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Impede o evento de propagação
    
    if (!question.trim()) {
      toast({
        title: "Erro ao enviar pergunta",
        description: "O texto da pergunta não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }
    askQuestionMutation.mutate();
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div 
      className={cn(
        "announcement-card rounded-xl shadow-lg overflow-hidden w-full border", 
        announcement.department === Department.CONTROLES_INTERNOS 
          ? "border-l-4 border-red-600 border-l-red-600 border-t-[#2a2a3a] border-r-[#2a2a3a] border-b-[#2a2a3a] hover:bg-red-950/10" 
          : announcement.department === Department.ADMINISTRATIVO 
          ? "border-l-4 border-blue-600 border-l-blue-600 border-t-[#2a2a3a] border-r-[#2a2a3a] border-b-[#2a2a3a] hover:bg-blue-950/10"
          : "border-l-4 border-emerald-600 border-l-emerald-600 border-t-[#2a2a3a] border-r-[#2a2a3a] border-b-[#2a2a3a] hover:bg-emerald-950/10",
        "cursor-pointer relative hover:shadow-xl transition-all duration-300 bg-gradient-to-b from-[#1a1a26] to-[#1c1c28]"
      )}
      onClick={handleCardClick}
    >
      <div className="p-6">
        <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-4">
          <div className="flex-grow min-w-0 max-w-full">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Badge className={cn("text-xs px-3 py-1.5 rounded-md", 
                announcement.department === Department.CONTROLES_INTERNOS 
                  ? "bg-red-900/40 text-red-300 border border-red-800" 
                  : announcement.department === Department.ADMINISTRATIVO 
                  ? "bg-blue-900/40 text-blue-300 border border-blue-800"
                  : "bg-emerald-900/40 text-emerald-300 border border-emerald-800")}>
                {getDepartmentLabel()}
              </Badge>
              <span 
                className={cn("category-icon h-7 w-7 rounded-md flex items-center justify-center backdrop-blur border", 
                announcement.department === Department.CONTROLES_INTERNOS 
                  ? "bg-red-950/30 border-red-900/50" 
                  : announcement.department === Department.ADMINISTRATIVO 
                  ? "bg-blue-950/30 border-blue-900/50"
                  : "bg-emerald-950/30 border-emerald-900/50")}
                title={getCategoryTitle()}
              >
                {getCategoryIcon()}
              </span>
              <p className="text-xs text-gray-400 ml-auto bg-[#13131d] px-3 py-1 rounded-md border border-[#2a2a3a]">
                {formatDate(announcement.createdAt)}
              </p>
            </div>
            
            <h3 className="font-semibold text-xl text-white tracking-tight leading-7">{announcement.title}</h3>
            <div className={cn("h-[2px] w-1/4 my-3", 
              announcement.department === Department.CONTROLES_INTERNOS 
                ? "bg-gradient-to-r from-red-600 to-transparent" 
                : announcement.department === Department.ADMINISTRATIVO 
                ? "bg-gradient-to-r from-blue-600 to-transparent"
                : "bg-gradient-to-r from-emerald-600 to-transparent")}></div>
            <p className="text-sm text-gray-300 mt-2 line-clamp-2 max-w-full leading-relaxed">{announcement.message}</p>
          </div>
          
          <div className="flex items-start">
            <button 
              className={cn(
                "read-flag h-10 w-10 rounded-md flex items-center justify-center transform transition-all duration-300",
                readStatus 
                  ? "bg-emerald-900/30 border border-emerald-700 shadow-md" 
                  : "bg-[#13131d] border border-[#2a2a3a] hover:border-gray-500 hover:shadow-md"
              )} 
              title={readStatus ? "Marcado como lido" : "Marcar como lido"}
              onClick={handleReadFlagClick}
              aria-label={readStatus ? "Marcado como lido" : "Marcar como lido"}
            >
              {toggleReadStatusMutation.isPending ? (
                <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
              ) : readStatus ? (
                <Check className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
              ) : (
                <Check className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
        
        {!isExpanded && (
          <div className="mt-4 flex items-center text-xs text-gray-400">
            <span className="flex items-center mr-4 bg-[#13131d] px-3 py-1.5 rounded-md border border-[#2a2a3a]">
              <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-2", 
                announcement.department === Department.CONTROLES_INTERNOS 
                  ? "bg-red-500" 
                  : announcement.department === Department.ADMINISTRATIVO 
                  ? "bg-blue-500"
                  : "bg-emerald-500")}></span>
              Clique para expandir
            </span>
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="border-t border-[#2a2a3a]" onClick={(e) => e.stopPropagation()}>
          <Tabs defaultValue="content">
            <div className="bg-[#161622] px-5 py-3 flex justify-between items-center border-b border-[#2a2a3a]">
              <TabsList className="w-[200px] bg-[#13131d] shadow-md border border-[#2a2a3a] rounded-lg overflow-hidden">
                <TabsTrigger 
                  value="content" 
                  className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-300 data-[state=active]:shadow-none w-full font-medium text-gray-300"
                >
                  Conteúdo
                </TabsTrigger>
              </TabsList>
              <TabsList className="w-auto bg-transparent">
                <TabsTrigger 
                  value="question" 
                  className="text-xs font-medium text-gray-300 hover:text-blue-300 
                  bg-[#13131d] shadow-md hover:shadow-lg border border-[#2a2a3a] rounded-lg
                  transition-all duration-300 px-4 h-9"
                >
                  Perguntas
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6 bg-[#1a1a26]">
              <TabsContent value="content" className="animate-in fade-in-50 duration-300">
                <div className="text-sm text-gray-300 whitespace-pre-line max-w-4xl leading-relaxed">
                  {announcement.message}
                </div>
                
                {announcement.attachment && (
                  <div className="mt-6 flex items-center text-sm text-blue-400 
                  hover:text-blue-300 bg-[#13131d] p-4 rounded-lg
                  border border-[#2a2a3a] shadow-sm hover:shadow-md transition-all duration-300">
                    <FileText className="h-5 w-5 mr-3" />
                    <a 
                      href={announcement.attachment} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-medium hover:underline"
                    >
                      {announcement.attachment.split('/').pop() || 'Anexo'}
                    </a>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="question" className="animate-in slide-in-from-right-5 duration-300">
                <div className="max-w-2xl">
                  <div className="bg-[#13131d] p-4 rounded-lg border border-[#2a2a3a] mb-4">
                    <h4 className="text-sm font-medium text-white mb-2">Envie uma pergunta ao autor</h4>
                    <p className="text-xs text-gray-400 mb-3">Utilize este espaço para esclarecer dúvidas sobre o comunicado.</p>
                  </div>
                
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="mt-1 w-full bg-[#13131d] shadow-sm focus:ring-1 focus:ring-blue-500 border border-[#2a2a3a] rounded-lg text-white placeholder:text-gray-500"
                    rows={4}
                    placeholder="Digite sua pergunta sobre este comunicado..."
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button
                      className={cn(
                        "hover:opacity-90 shadow-md px-5 rounded-lg transition-all duration-300", 
                        announcement.department === Department.CONTROLES_INTERNOS 
                          ? "bg-gradient-to-r from-red-800 to-red-700 text-white hover:shadow-red-900/20 hover:shadow-lg" 
                          : announcement.department === Department.ADMINISTRATIVO 
                          ? "bg-gradient-to-r from-blue-800 to-blue-700 text-white hover:shadow-blue-900/20 hover:shadow-lg"
                          : "bg-gradient-to-r from-emerald-800 to-emerald-700 text-white hover:shadow-emerald-900/20 hover:shadow-lg"
                      )}
                      onClick={(e) => handleAskQuestion(e)}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={askQuestionMutation.isPending}
                    >
                      {askQuestionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar Pergunta"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
      
      {/* Delete button - only visible for admin creator */}
      {isCreator && (
        <button
          className="delete-announcement absolute bottom-4 right-4 bg-[#13131d] rounded-lg p-2 shadow-md text-red-400 hover:text-red-300 hover:bg-red-900/30 hover:shadow-lg focus:outline-none z-10 transition-all border border-[#2a2a3a]"
          title="Excluir comunicado"
          onClick={handleDeleteClick}
          aria-label="Excluir comunicado"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )}
      
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir Comunicado"
        description="Tem certeza que deseja excluir este comunicado? Esta ação não pode ser desfeita."
        onConfirm={() => deleteAnnouncementMutation.mutate()}
        isLoading={deleteAnnouncementMutation.isPending}
      />
    </div>
  );
}
