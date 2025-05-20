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
        "announcement-card rounded-lg overflow-hidden w-full", 
        announcement.department === Department.CONTROLES_INTERNOS 
          ? "hover:bg-gradient-to-r hover:from-red-500/5 hover:to-transparent" 
          : announcement.department === Department.ADMINISTRATIVO 
          ? "hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-transparent"
          : "hover:bg-gradient-to-r hover:from-green-500/5 hover:to-transparent",
        "cursor-pointer relative transition-all duration-300 bg-[#2d2d38]"
      )}
      onClick={handleCardClick}
    >
      <div className="px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-2">
          <div className="flex-grow min-w-0 max-w-full">
            <div className="flex items-center flex-wrap gap-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", 
                  announcement.department === Department.CONTROLES_INTERNOS 
                    ? "bg-red-500" 
                    : announcement.department === Department.ADMINISTRATIVO 
                    ? "bg-blue-500"
                    : "bg-emerald-500")}></div>
                <span className="text-xs font-medium text-gray-300">
                  {getDepartmentLabel()}
                </span>
              </div>
              <div 
                className="ml-2 flex items-center gap-1"
                title={getCategoryTitle()}
              >
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">{getCategoryTitle()}</span>
              </div>
              <p className="text-xs text-gray-400 ml-auto">
                {formatDate(announcement.createdAt)}
              </p>
            </div>
            
            <h3 className="font-semibold text-base sm:text-lg text-white tracking-tight leading-snug">{announcement.title}</h3>
            <p className="text-sm text-gray-300 mt-1.5 line-clamp-2 max-w-full leading-relaxed">{announcement.message}</p>
          </div>
          
          <div className="flex items-start ml-2 mt-0.5">
            <button 
              className={cn(
                "read-flag h-8 w-8 rounded-full flex items-center justify-center transform transition-all duration-300",
                readStatus 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "text-gray-500 hover:text-gray-300"
              )} 
              title={readStatus ? "Marcado como lido" : "Marcar como lido"}
              onClick={handleReadFlagClick}
              aria-label={readStatus ? "Marcado como lido" : "Marcar como lido"}
            >
              {toggleReadStatusMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : readStatus ? (
                <Check className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <Check className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
        
        {!isExpanded && (
          <div className="mt-3 flex">
            <button className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              <span className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-blue-500/10">
                <span className="sr-only">Expandir</span>
                <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 0L5.5 4.5H0.5L3 0Z" fill="currentColor"/>
                </svg>
              </span>
              <span>Expandir</span>
            </button>
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-700/30" onClick={(e) => e.stopPropagation()}>
          <Tabs defaultValue="content">
            <div className="bg-[#353542] px-4 py-2 flex justify-between items-center">
              <TabsList className="bg-transparent">
                <TabsTrigger 
                  value="content" 
                  className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-300 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none px-4 py-2 font-medium text-gray-300 rounded-none border-b-2 border-transparent"
                >
                  Conteúdo
                </TabsTrigger>
                <TabsTrigger 
                  value="question" 
                  className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-300 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none px-4 py-2 font-medium text-gray-300 rounded-none border-b-2 border-transparent"
                >
                  Perguntas
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-4 bg-[#2d2d38]">
              <TabsContent value="content" className="animate-in fade-in-50 duration-300">
                <div className="text-sm text-gray-200 whitespace-pre-line max-w-full leading-relaxed">
                  {announcement.message}
                </div>
                
                {announcement.attachment && (
                  <div className="mt-4 flex items-center text-sm text-blue-400 
                  hover:text-blue-300 bg-[#353542] p-3 rounded
                  hover:bg-[#2b2b3a] transition-all duration-300">
                    <FileText className="h-4 w-4 mr-2" />
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
              
              <TabsContent value="question" className="animate-in fade-in-50 duration-300">
                <div className="max-w-full">
                  <p className="text-sm text-gray-300 mb-3">Envie uma pergunta sobre este comunicado:</p>
                
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full bg-[#353542] border-0 focus:ring-1 focus:ring-blue-500 rounded text-white placeholder:text-gray-500 resize-none"
                    rows={3}
                    placeholder="Digite sua pergunta aqui..."
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      className={cn(
                        "px-3 py-1.5 h-auto text-sm rounded transition-colors", 
                        announcement.department === Department.CONTROLES_INTERNOS 
                          ? "bg-red-500 hover:bg-red-600 text-white" 
                          : announcement.department === Department.ADMINISTRATIVO 
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-emerald-500 hover:bg-emerald-600 text-white"
                      )}
                      onClick={(e) => handleAskQuestion(e)}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={askQuestionMutation.isPending}
                    >
                      {askQuestionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar"
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
          className="delete-announcement absolute bottom-3 right-3 opacity-70 hover:opacity-100 text-gray-400 hover:text-red-400 focus:outline-none z-10 transition-all rounded-full p-1.5"
          title="Excluir comunicado"
          onClick={handleDeleteClick}
          aria-label="Excluir comunicado"
        >
          <Trash2 className="h-4 w-4" />
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
