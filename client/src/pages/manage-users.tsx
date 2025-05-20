import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole, User, Department, Location } from "@shared/schema";
import AppLayout from "@/layouts/AppLayout";
import UserModal from "@/components/users/UserModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit } from "lucide-react";
import { useLocation } from "wouter";

export default function ManageUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      navigate("/announcements");
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Create/update user mutation
  const userMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { id?: number }) => {
      if (userData.id) {
        // Update existing user
        const res = await apiRequest("PATCH", `/api/users/${userData.id}`, userData);
        return await res.json();
      } else {
        // Create new user
        const res = await apiRequest("POST", "/api/users", userData);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: currentUser ? "Usuário Atualizado" : "Usuário Criado",
        description: currentUser 
          ? "As informações do usuário foram atualizadas com sucesso!" 
          : "O novo usuário foi criado com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsModalOpen(false);
      setCurrentUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openAddUserModal = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = (userData: Partial<User>) => {
    userMutation.mutate(currentUser ? { ...userData, id: currentUser.id } : userData);
  };

  // Function to get department badge class
  const getDepartmentBadgeClass = (department?: Department) => {
    switch (department) {
      case Department.CONTROLES_INTERNOS:
        return "badge-controles";
      case Department.ADMINISTRATIVO:
        return "badge-administrativo";
      case Department.CICLO_DE_CREDITO:
        return "badge-credito";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <AppLayout title="Gerenciar Usuários">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5 bg-[#353542] rounded-lg overflow-hidden shadow">
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-700/30">
            <h3 className="text-sm font-medium text-blue-300">Lista de usuários do sistema</h3>
            
            <Button
              onClick={openAddUserModal}
              className="h-9 text-sm px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Adicionar Usuário
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8 bg-[#2d2d38]">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-2" />
                <span className="text-sm text-gray-400">Carregando usuários...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#282833] border-b border-gray-700/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Papel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Área / Locais
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#2d2d38] divide-y divide-gray-700/30">
                  {users?.map((user) => (
                    <tr key={user.id} className="hover:bg-[#353542] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-9 w-9 bg-blue-500/10 rounded-md">
                            <AvatarImage src="" alt={user.name} />
                            <AvatarFallback className="bg-blue-500/20 text-blue-300 rounded-md">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-xs text-gray-400">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={user.role === UserRole.ADMIN 
                          ? "bg-emerald-500/10 text-emerald-400 border-0" 
                          : "bg-blue-500/10 text-blue-400 border-0"}>
                          {user.role === UserRole.ADMIN ? "Admin" : "Leitor"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.role === UserRole.ADMIN && user.actingDepartment ? (
                          <Badge className={
                            user.actingDepartment === Department.CONTROLES_INTERNOS 
                              ? "bg-red-500/10 text-red-400 border-0" 
                              : user.actingDepartment === Department.ADMINISTRATIVO 
                                ? "bg-blue-500/10 text-blue-400 border-0" 
                                : "bg-emerald-500/10 text-emerald-400 border-0"
                          }>
                            {user.actingDepartment === Department.CONTROLES_INTERNOS 
                              ? "Controles Internos" 
                              : user.actingDepartment === Department.ADMINISTRATIVO 
                                ? "Administrativo" 
                                : "Ciclo de Crédito"}
                          </Badge>
                        ) : user.role === UserRole.READER && user.assignedLocations?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {(user.assignedLocations as Location[]).map((location, index) => (
                              <Badge key={index} className="bg-gray-700/40 text-gray-300 border-0">
                                {location === Location.MARACAJU 
                                  ? "Maracaju" 
                                  : location === Location.SIDROLANDIA 
                                    ? "Sidrolândia" 
                                    : location === Location.AQUIDAUANA 
                                      ? "Aquidauana" 
                                      : "Nioaque"}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          onClick={() => openEditUserModal(user)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <UserModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        user={currentUser}
        onSave={handleSaveUser}
        isPending={userMutation.isPending}
      />
    </AppLayout>
  );
}
