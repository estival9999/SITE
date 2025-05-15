import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, UserRole, Department, Location } from "@shared/schema";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface UserModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSave: (userData: Partial<User>) => void;
  isPending: boolean;
}

// Schema for user form
const userFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional().or(z.literal("")),
  role: z.nativeEnum(UserRole),
  actingDepartment: z.nativeEnum(Department).nullable().optional(),
  assignedLocations: z.array(z.nativeEnum(Location)).optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UserModal({ isOpen, onOpenChange, user, onSave, isPending }: UserModalProps) {
  const isEditMode = !!user;

  // Set up form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      username: user?.username || "",
      password: "", // Don't pre-fill password
      role: user?.role || UserRole.READER,
      actingDepartment: user?.actingDepartment || null,
      assignedLocations: user?.assignedLocations as Location[] || [],
    },
  });

  // Update form when user changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: user?.name || "",
        email: user?.email || "",
        username: user?.username || "",
        password: "", // Don't pre-fill password
        role: user?.role || UserRole.READER,
        actingDepartment: user?.actingDepartment || null,
        assignedLocations: user?.assignedLocations as Location[] || [],
      });
    }
  }, [isOpen, user, form]);

  // Submit handler
  const onSubmit = (data: UserFormValues) => {
    // Remove empty password field if not provided
    if (!data.password) {
      delete data.password;
    }
    
    // Clean up empty fields
    if (data.role !== UserRole.ADMIN) {
      data.actingDepartment = null;
    }
    
    if (data.role !== UserRole.READER) {
      data.assignedLocations = [];
    }
    
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Usuário" : "Adicionar Novo Usuário"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome de usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditMode ? "Nova Senha (opcional)" : "Senha"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={isEditMode ? "Deixe em branco para não alterar" : "Senha do usuário"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.READER}>Leitor</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("role") === UserRole.ADMIN && (
              <FormField
                control={form.control}
                name="actingDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área de Atuação</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "NO_DEPARTMENT" ? null : value)}
                      value={field.value || "NO_DEPARTMENT"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma área de atuação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NO_DEPARTMENT">Sem restrição de área</SelectItem>
                        <SelectItem value={Department.CONTROLES_INTERNOS}>Controles Internos</SelectItem>
                        <SelectItem value={Department.ADMINISTRATIVO}>Administrativo</SelectItem>
                        <SelectItem value={Department.CICLO_DE_CREDITO}>Ciclo de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Se definido, este Admin só poderá criar comunicados para a área selecionada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {form.watch("role") === UserRole.READER && (
              <FormField
                control={form.control}
                name="assignedLocations"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Locais Atribuídos</FormLabel>
                      <FormDescription className="text-xs">
                        Selecione os locais para os quais este leitor pode visualizar comunicados.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md">
                      {[
                        { value: Location.MARACAJU, label: "Maracaju" },
                        { value: Location.SIDROLANDIA, label: "Sidrolândia" },
                        { value: Location.AQUIDAUANA, label: "Aquidauana" },
                        { value: Location.NIOAQUE, label: "Nioaque" },
                      ].map((location) => (
                        <FormField
                          key={location.value}
                          control={form.control}
                          name="assignedLocations"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={location.value}
                                className="flex flex-row items-center space-x-2 space-y-0 mb-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(location.value)}
                                    onCheckedChange={(checked) => {
                                      const updatedValues = checked
                                        ? [...(field.value || []), location.value]
                                        : field.value?.filter(
                                            (value) => value !== location.value
                                          );
                                      field.onChange(updatedValues);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm cursor-pointer">
                                  {location.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormDescription className="text-xs mt-1">
                      Se nenhum local for selecionado, o leitor não poderá visualizar comunicados.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#5e8c6a] hover:bg-[#88a65e]"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? "Salvando..." : "Adicionando..."}
                  </>
                ) : (
                  isEditMode ? "Salvar alterações" : "Adicionar usuário"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
