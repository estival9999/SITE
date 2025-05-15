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
        "announcement-card rounded-xl shadow-lg overflow-hidden w-full", 
        getDepartmentClass(),
        "cursor-pointer relative"
      )}
      onClick={handleCardClick}
    >
      <div className="p-6 bg-[var(--color-bg-card)]">
        <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-4">
          <div className="flex-grow min-w-0 max-w-full">
            <div className="flex items-center mb-4">
              <Badge className={cn("text-xs px-3 py-1.5 rounded-full", getDepartmentBadgeClass())}>
                {getDepartmentLabel()}
              </Badge>
              <span 
                className="category-icon bg-[var(--color-bg-main)] h-8 w-8 rounded-full flex items-center justify-center ml-3 backdrop-blur border border-[var(--color-border)]" 
                title={getCategoryTitle()}
              >
                {getCategoryIcon()}
              </span>
              <p className="text-sm text-[var(--color-text-light)] ml-auto">{formatDate(announcement.createdAt)}</p>
            </div>
            
            <h3 className="font-semibold text-xl text-[var(--color-text-dark)] tracking-tight leading-7">{announcement.title}</h3>
            <div className="h-[1px] w-1/3 bg-gradient-to-r from-[var(--color-accent-primary)] via-[var(--color-accent-secondary)] to-transparent my-3 opacity-60"></div>
            <p className="text-sm text-[var(--color-text-medium)] mt-2 line-clamp-2 max-w-full leading-relaxed">{announcement.message}</p>
          </div>
          
          <div className="flex items-start">
            <button 
              className={cn(
                "read-flag h-10 w-10 rounded-full flex items-center justify-center transform transition-all duration-300",
                readStatus 
                  ? "bg-gradient-to-b from-[#ecf9f0] to-[#d7f5e1] border-2 border-[var(--color-accent-secondary)] shadow-md shadow-green-300/20" 
                  : "bg-gradient-to-b from-[var(--color-bg-main)] to-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-text-light)] hover:shadow-md"
              )} 
              title={readStatus ? "Marcado como lido" : "Marcar como lido"}
              onClick={handleReadFlagClick}
              aria-label={readStatus ? "Marcado como lido" : "Marcar como lido"}
              style={{ 
                animation: toggleReadStatusMutation.isPending ? 'subtlePulse 1s infinite' : 'none'
              }}
            >
              {toggleReadStatusMutation.isPending ? (
                <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
              ) : readStatus ? (
                <Check className="h-5 w-5 text-green-600 animate-checkmark" strokeWidth={2.5} />
              ) : (
                <Check className="h-5 w-5 text-gray-300" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
        
        {!isExpanded && (
          <div className="mt-4 flex items-center text-xs text-[var(--color-text-light)] opacity-70">
            <span className="flex items-center mr-4">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent-primary)] mr-1.5"></span>
              Clique para expandir
            </span>
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="border-t border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
          <Tabs defaultValue="content">
            <div className="bg-[var(--color-bg-main)] px-5 py-3 flex justify-between items-center border-b border-[var(--color-border)]">
              <TabsList className="w-[200px] bg-white/80 backdrop-blur-sm shadow-md">
                <TabsTrigger value="content" className="tab-active w-full font-semibold text-base">Conteúdo</TabsTrigger>
              </TabsList>
              <TabsList className="w-auto bg-transparent">
                <TabsTrigger 
                  value="question" 
                  className="text-xs font-medium text-[var(--color-text-medium)] hover:text-[var(--color-accent-primary)] 
                  bg-white shadow-md hover:shadow-lg border border-[var(--color-border)] rounded-full
                  transition-all duration-300 px-4"
                >
                  Perguntas
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6 bg-white">
              <TabsContent value="content" className="animate-in fade-in-50 duration-300">
                <div className="text-sm text-[var(--color-text-medium)] whitespace-pre-line max-w-4xl leading-relaxed">
                  {announcement.message}
                </div>
                
                {announcement.attachment && (
                  <div className="mt-6 flex items-center text-sm text-[var(--color-accent-primary)] 
                  hover:text-[var(--color-accent-secondary)] bg-[var(--color-bg-main)] p-3 rounded-lg
                  border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all duration-300">
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
                  <div className="bg-[var(--color-bg-main)]/70 p-4 rounded-lg border border-[var(--color-border)] mb-4">
                    <h4 className="text-sm font-medium text-[var(--color-text-dark)] mb-2">Envie uma pergunta ao autor</h4>
                    <p className="text-xs text-[var(--color-text-light)] mb-3">Utilize este espaço para esclarecer dúvidas sobre o comunicado.</p>
                  </div>
                
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="mt-1 w-full bg-white shadow-sm focus:shadow border border-[var(--color-border)] rounded-lg"
                    rows={4}
                    placeholder="Digite sua pergunta sobre este comunicado..."
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button
                      className={cn(
                        "hover:opacity-90 shadow-md px-5 rounded-full transition-all duration-300", 
                        announcement.department === Department.CONTROLES_INTERNOS 
                          ? "bg-gradient-to-r from-[#8c2318] to-[#a62e24] hover:shadow-[#8c2318]/20 hover:shadow-lg" 
                          : announcement.department === Department.ADMINISTRATIVO 
                          ? "bg-gradient-to-r from-[#4a7dbe] to-[#5a8fd0] hover:shadow-[#4a7dbe]/20 hover:shadow-lg"
                          : "bg-gradient-to-r from-[#88a65e] to-[#96b46a] hover:shadow-[#88a65e]/20 hover:shadow-lg"
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
          className="delete-announcement absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-md text-gray-500 hover:text-[#8c2318] hover:shadow-lg focus:outline-none z-10 transition-all"
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
