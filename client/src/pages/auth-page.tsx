import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/layouts/AuthLayout";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Form setup for login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "admin",
      password: "admin",
      rememberMe: false,
    },
  });

  // Form setup for registration
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
    },
  });

  // Form submission handlers
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      name: data.name,
      email: data.email,
      username: data.username,
      password: data.password,
      role: "READER", // Default to reader role for registration through the UI
    });
  };

  return (
    <AuthLayout>
      <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a]">
          <TabsTrigger 
            value="login" 
            className={cn(
              "data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white text-gray-300"
            )}
          >
            Login
          </TabsTrigger>
          <TabsTrigger 
            value="register" 
            className={cn(
              "data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white text-gray-300"
            )}
          >
            Cadastro
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6 mt-6">
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Usuário</h3>
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="admin ou user" 
                          {...field} 
                          className="bg-[#1a1a1a] border-[#333] text-white h-12"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-500 mt-1">Usuários de teste: admin2 ou user2</div>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Senha</h3>
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="bg-[#1a1a1a] border-[#333] text-white h-12"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-500 mt-1">Senha de teste: password</div>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <FormField
                  control={loginForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="rememberMe"
                          className="border-[#444] data-[state=checked]:bg-[#1e3a8a] data-[state=checked]:border-[#1e3a8a]"
                        />
                      </FormControl>
                      <label
                        htmlFor="rememberMe"
                        className="text-sm font-medium text-gray-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Lembrar-me
                      </label>
                    </FormItem>
                  )}
                />
                
                <a href="#" className="text-sm font-medium text-gray-300 hover:text-blue-400">
                  Esqueceu a senha?
                </a>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-[#1e3a8a] hover:bg-[#2d4ba0] h-12 mt-6 font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="register">
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6 mt-6">
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Nome completo</h3>
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="Seu nome completo" 
                          {...field}
                          className="bg-[#1a1a1a] border-[#333] text-white h-12" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Email</h3>
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Seu email" 
                          {...field}
                          className="bg-[#1a1a1a] border-[#333] text-white h-12" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Nome de usuário</h3>
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="Escolha um nome de usuário" 
                          {...field}
                          className="bg-[#1a1a1a] border-[#333] text-white h-12" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Senha</h3>
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field}
                          className="bg-[#1a1a1a] border-[#333] text-white h-12" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-[#1e3a8a] hover:bg-[#2d4ba0] h-12 mt-6 font-medium"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}
