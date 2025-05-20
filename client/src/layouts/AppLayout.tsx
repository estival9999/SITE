import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  PencilIcon, 
  MailIcon, 
  CircleHelp, 
  SearchIcon, 
  MessageSquarePlus, 
  Users, 
  LogOut, 
  MenuIcon, 
  XIcon,
  Network,
  Bell,
  Home,
  Settings,
  Sparkles,
  ArrowLeftRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserRole } from "@shared/schema";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(location);
  const [showTipToast, setShowTipToast] = useState(false);
  const { toast } = useToast();
  
  const isAdmin = user?.role === UserRole.ADMIN;
  
  // Efeito para exibir dicas sobre o sistema
  useEffect(() => {
    const tipTimer = setTimeout(() => {
      if (Math.random() > 0.7) {
        setShowTipToast(true);
      }
    }, 5000);
    
    return () => clearTimeout(tipTimer);
  }, [location]);
  
  // Exibe dicas aleatoriamente ao navegar pelo sistema
  useEffect(() => {
    if (showTipToast) {
      const tips = [
        "💡 Dica: Clique no botão de marcação de leitura para confirmar que você leu um comunicado.",
        "💡 Dica: A função de Busca de Conhecimento utiliza IA para responder suas perguntas sobre a empresa.",
        "💡 Dica: O Mapa Mental permite visualizar informações em um formato gráfico e interativo.",
        "💡 Dica: Você pode enviar perguntas a um comunicado usando a aba 'Perguntas'."
      ];
      
      toast({
        title: "Dica rápida",
        description: tips[Math.floor(Math.random() * tips.length)],
        variant: "default",
        duration: 5000,
      });
      
      setShowTipToast(false);
    }
  }, [showTipToast, toast]);
  
  // Menu de navegação atualizado com ícones modernos
  const navigationItems = [
    ...(isAdmin ? [
      { 
        name: 'Registrar Comunicado', 
        href: '/register-announcement', 
        icon: PencilIcon, 
        adminOnly: true,
        color: "from-blue-500 to-blue-600"
      },
    ] : []),
    { 
      name: 'Caixa de Comunicados', 
      href: '/announcements', 
      icon: MailIcon, 
      adminOnly: false,
      color: "from-blue-400 to-blue-500" 
    },
    { 
      name: 'Minhas Perguntas', 
      href: '/my-questions', 
      icon: CircleHelp, 
      adminOnly: false,
      color: "from-purple-400 to-purple-500"
    },
    { 
      name: 'Busca de Conhecimento', 
      href: '/knowledge-search', 
      icon: SearchIcon, 
      adminOnly: false,
      color: "from-emerald-400 to-emerald-500"
    },
    { 
      name: 'Mapa Mental', 
      href: '/mind-map', 
      icon: Network, 
      adminOnly: false,
      color: "from-amber-400 to-amber-500"
    },
    ...(isAdmin ? [
      { 
        name: 'Perguntas Recebidas', 
        href: '/received-questions', 
        icon: MessageSquarePlus, 
        adminOnly: true,
        color: "from-red-400 to-red-500"
      },
      { 
        name: 'Gerenciar Usuários', 
        href: '/manage-users', 
        icon: Users, 
        adminOnly: true,
        color: "from-indigo-400 to-indigo-500"
      },
    ] : []),
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Animações para o menu 
  const sidebarVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar com animações */}
      <motion.div 
        className="bg-[#1a1a24] text-white w-72 flex-shrink-0 hidden md:flex md:flex-col drop-shadow-lg border-r border-[#333]"
        initial="initial"
        animate="animate"
        variants={sidebarVariants}
      >
        <div className="flex items-center justify-center h-20 border-b border-[#333] bg-[#0c0c0c] backdrop-blur-sm">
          <Logo size="medium" withText />
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-800">
          <div className="space-y-1.5 px-3">
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.href}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-gray-300 transition-all duration-200 rounded-lg relative group",
                    location === item.href 
                      ? "bg-blue-600/10 text-white shadow-md" 
                      : "hover:bg-blue-500/5"
                  )}
                >
                  {/* Borda animada para item ativo */}
                  {location === item.href && (
                    <motion.div 
                      className={`absolute left-0 top-0 h-full w-1 rounded-l-md bg-gradient-to-b ${item.color}`}
                      layoutId="activeNavIndicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Círculo de fundo do ícone com gradiente */}
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center mr-3",
                    location === item.href 
                      ? `bg-gradient-to-br ${item.color} text-white shadow-lg`
                      : "bg-gray-800/50 group-hover:bg-blue-500/10"
                  )}>
                    <item.icon className="h-[18px] w-[18px]" />
                  </div>
                  
                  <span className={location === item.href ? "font-medium" : ""}>
                    {item.name}
                  </span>
                  
                  {/* Indicador visual para itens ativos */}
                  {location === item.href && (
                    <motion.span 
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </nav>
        
        {/* Rodapé da sidebar com informações do usuário */}
        <motion.div 
          className="p-4 border-t border-[#333] mt-4 bg-[#1a1a1a]/70 backdrop-blur"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center">
            <Avatar className="h-11 w-11 ring-2 ring-blue-500/20 shadow-lg">
              <AvatarImage src="" alt={user?.name || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-[#1e3a8a] to-[#2d4ba0] text-white font-medium animate-gradient">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-300 flex items-center mt-0.5">
                <motion.span 
                  className="inline-block h-2 w-2 rounded-full bg-blue-400 mr-1.5"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                {user?.role === UserRole.ADMIN ? (
                  <span className="flex items-center">
                    Administrador
                    <Sparkles className="h-3 w-3 ml-1 text-yellow-400 animate-pulse" />
                  </span>
                ) : "Leitor"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleLogout}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all duration-300 border-none h-9"
            variant="secondary"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </motion.div>
      </motion.div>

      {/* Mobile menu overlay */}
      <motion.div
        className={cn(
          "fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden",
          mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        onClick={toggleMobileMenu}
        initial={{ opacity: 0 }}
        animate={{ opacity: mobileMenuOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Mobile sidebar com animações */}
      <motion.div
        className="fixed inset-y-0 left-0 z-50 w-full bg-[#1a1a24] text-white md:hidden overflow-y-auto"
        initial={{ x: "-100%" }}
        animate={{ x: mobileMenuOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <Logo size="small" withText />
          <button
            className="text-white focus:outline-none bg-blue-500/10 p-2 rounded-full hover:bg-blue-500/20 transition-colors"
            onClick={toggleMobileMenu}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 px-4">
          <div className="space-y-1">
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-gray-300 transition-all duration-200 rounded-md relative",
                    location === item.href 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-md` 
                      : "hover:bg-blue-500/10"
                  )}
                  onClick={toggleMobileMenu}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 w-full px-4 py-4 border-t border-[#333] bg-[#1a1a1a]/80 backdrop-blur-md">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 ring-1 ring-blue-500/20">
              <AvatarImage src="" alt={user?.name || "User"} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white animate-gradient">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-300 flex items-center">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                {user?.role === UserRole.ADMIN ? "Administrador" : "Leitor"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleLogout}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 h-10 text-white"
            variant="secondary"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </motion.div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar modernizado */}
        <motion.header 
          className="bg-[#181820] shadow-lg relative z-10 border-b border-[#333]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center">
              <motion.button
                className="md:hidden text-gray-300 hover:text-white focus:outline-none mr-3 bg-[#1f1f2c] p-2 rounded-full shadow-md"
                onClick={toggleMobileMenu}
                whileTap={{ scale: 0.9 }}
              >
                <MenuIcon className="h-5 w-5" />
              </motion.button>
              
              <div className="flex items-center">
                <motion.h1 
                  className="text-xl font-semibold text-white tracking-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={title} // Animação quando o título muda
                  transition={{ duration: 0.3 }}
                >
                  {title}
                </motion.h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Botão de notificações simulado */}
              <motion.button
                className="relative p-2 text-gray-300 hover:text-white rounded-full bg-[#1f1f2c] hover:bg-blue-500/10 transition-colors hidden md:flex"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-[#181820]"></span>
              </motion.button>
              
              {/* Avatar do usuário */}
              <Avatar className="h-8 w-8 ring-1 ring-blue-500/20 shadow-md cursor-pointer">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs animate-gradient">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </motion.header>

        {/* Main content com animação de entrada */}
        <motion.main 
          className="flex-1 overflow-y-auto bg-[#2d2d38] p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
