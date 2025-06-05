import { ReactNode, useState } from "react";
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
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserRole } from "@shared/schema";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isAdmin = user?.role === UserRole.ADMIN;
  
  const navigationItems = [
    ...(isAdmin ? [
      { 
        name: 'Registrar Comunicado', 
        href: '/register-announcement', 
        icon: PencilIcon, 
        adminOnly: true 
      },
    ] : []),
    { 
      name: 'Caixa de Comunicados', 
      href: '/announcements', 
      icon: MailIcon, 
      adminOnly: false 
    },
    { 
      name: 'Minhas Perguntas', 
      href: '/my-questions', 
      icon: CircleHelp, 
      adminOnly: false 
    },
    { 
      name: 'Busca de Conhecimento', 
      href: '/knowledge-search', 
      icon: SearchIcon, 
      adminOnly: false 
    },
    { 
      name: 'Mapa Mental', 
      href: '/mind-map', 
      icon: Network, 
      adminOnly: false 
    },
    ...(isAdmin ? [
      { 
        name: 'Perguntas Recebidas', 
        href: '/received-questions', 
        icon: MessageSquarePlus, 
        adminOnly: true 
      },
      { 
        name: 'Gerenciar Usuários', 
        href: '/manage-users', 
        icon: Users, 
        adminOnly: true 
      },
    ] : []),
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - CORRIGIDA PARA NÃO PISCAR */}
      <div className="bg-[#121212] text-white w-72 flex-shrink-0 hidden md:flex md:flex-col border-r border-[#333]" style={{ position: 'relative', zIndex: 10 }}>
        <div className="flex items-center justify-center h-20 border-b border-[#333] bg-[#0c0c0c] backdrop-blur-sm">
          <Logo size="medium" withText />
        </div>

        <nav className="mt-8 flex-1">
          <div className="space-y-2 px-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "sidebar-nav-item",
                  location === item.href && "sidebar-nav-item-active"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
        
        <div className="p-5 border-t border-[#333] mt-4 bg-[#1a1a1a] backdrop-blur">
          <div className="flex items-center">
            <Avatar className="h-11 w-11 ring-2 ring-[#333] shadow-lg">
              <AvatarImage src="" alt={user?.name || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-[#2d5016] to-[#3a6b1e] text-white font-medium">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-300 flex items-center mt-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400 mr-1.5"></span>
                {user?.role === UserRole.ADMIN ? "Administrador" : "Leitor"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleLogout}
            className="w-full mt-5 bg-[#2d5016] hover:bg-[#3a6b1e] text-white shadow-md transition-all duration-300 border-none h-10"
            variant="secondary"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleMobileMenu}
      />

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-full bg-[#121212] text-white transform transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <Logo size="small" withText />
          <button
            className="text-white focus:outline-none"
            onClick={toggleMobileMenu}
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-4 px-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-gray-300 hover:bg-[#3a6b1e] transition-colors duration-200 rounded-md",
                  location === item.href && "bg-[#2d5016] text-white"
                )}
                onClick={toggleMobileMenu}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 w-full px-4 py-4 border-t border-[#333]">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="" alt={user?.name || "User"} />
              <AvatarFallback className="bg-[#2d5016] text-white">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-300">
                {user?.role === UserRole.ADMIN ? "Administrador" : "Leitor"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleLogout}
            className="w-full mt-4 bg-[#2d5016] hover:bg-[#3a6b1e] h-10 text-white"
            variant="secondary"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-[#0c0c0c] shadow-md relative z-10 border-b border-[#333]">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                className="md:hidden text-gray-300 hover:text-white focus:outline-none mr-3 bg-[#1a1a1a] p-2 rounded-lg shadow-md"
                onClick={toggleMobileMenu}
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-white tracking-tight">{title}</h1>
            </div>
            
            <div className="md:hidden flex items-center">
              <Avatar className="h-8 w-8 ring-2 ring-[#333] shadow-md">
                <AvatarFallback className="bg-[#2d5016] text-white text-xs">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#2d2d38] p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
