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
        "announcement-card bg-white rounded-lg shadow overflow-hidden w-full", 
        getDepartmentClass(),
        "cursor-pointer hover:shadow-md relative"
      )}
      onClick={handleCardClick}
    >
      <div className="p-5">
        <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-4">
          <div className="flex-grow min-w-0 max-w-full">
            <div className="flex items-center mb-3">
              <Badge className={cn("text-xs px-3 py-1", getDepartmentBadgeClass())}>
                {getDepartmentLabel()}
              </Badge>
              <span 
                className="category-icon bg-gray-200 h-6 w-6 rounded-full flex items-center justify-center ml-3" 
                title={getCategoryTitle()}
              >
                {getCategoryIcon()}
              </span>
            </div>
            
            <h3 className="font-semibold text-lg text-gray-800">{announcement.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{formatDate(announcement.createdAt)}</p>
            <p className="text-sm text-gray-700 mt-3 line-clamp-2 max-w-full">{announcement.message}</p>
          </div>
          
          <div className="flex items-start">
            <button 
              className={cn(
                "read-flag group h-9 w-9 rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-110",
                readStatus 
                  ? "bg-gradient-to-br from-green-400 to-green-600 ring-2 ring-green-300 ring-opacity-50" 
                  : "bg-gradient-to-br from-gray-100 to-gray-300 hover:from-green-100 hover:to-green-300"
              )} 
              title={readStatus ? "Marcado como lido" : "Marcar como lido"}
              onClick={handleReadFlagClick}
              aria-label={readStatus ? "Marcado como lido" : "Marcar como lido"}
              style={{ 
                boxShadow: readStatus ? '0 0 15px rgba(74, 222, 128, 0.6)' : 'none',
                animation: toggleReadStatusMutation.isPending ? 'pulse 1.5s infinite' : readStatus ? 'scaleIn 0.5s 1' : 'none',
                transform: `translateZ(0)` // Para melhor performance de animação
              }}
            >
              {toggleReadStatusMutation.isPending ? (
                <RefreshCw className="h-4 w-4 text-white animate-spin" />
              ) : readStatus ? (
                <Check className="h-5 w-5 text-white animate-scaleIn" />
              ) : (
                <Check className="h-5 w-5 text-gray-400 group-hover:text-green-500" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
          <Tabs defaultValue="content">
            <div className="bg-gray-50 px-5 py-3 flex justify-between items-center">
              <TabsList className="w-[200px]">
                <TabsTrigger value="content" className="tab-active w-full font-semibold text-base">Conteúdo</TabsTrigger>
              </TabsList>
              <TabsList className="w-auto bg-transparent">
                <TabsTrigger value="question" className="text-xs text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 border border-gray-200">Perguntas</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-5">
              <TabsContent value="content">
                <div className="text-sm text-gray-700 whitespace-pre-line max-w-4xl">
                  {announcement.message}
                </div>
                
                {announcement.attachment && (
                  <div className="mt-5 flex items-center text-sm text-[#5e8c6a] hover:text-[#88a65e]">
                    <FileText className="h-5 w-5 mr-2" />
                    <a href={announcement.attachment} target="_blank" rel="noopener noreferrer" className="font-medium">
                      {announcement.attachment.split('/').pop()}
                    </a>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="question">
                <div className="max-w-2xl">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="mt-1 w-full"
                    rows={4}
                    placeholder="Digite sua pergunta sobre este comunicado..."
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button
                      className={cn(
                        "hover:opacity-90", 
                        announcement.department === Department.CONTROLES_INTERNOS ? "bg-red-500" :
                        announcement.department === Department.ADMINISTRATIVO ? "bg-blue-500" : 
                        "bg-green-500"
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
