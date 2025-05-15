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
  XIcon 
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
      {/* Sidebar */}
      <div className="bg-[var(--color-bg-sidebar)] text-white w-72 flex-shrink-0 hidden md:flex md:flex-col drop-shadow-lg">
        <div className="flex items-center justify-center h-20 border-b border-[#ffffff20] bg-[var(--color-bg-sidebar)] backdrop-blur-sm">
          <Logo size="medium" withText />
        </div>

        <nav className="mt-8 flex-1">
          <div className="space-y-2 px-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-6 py-3.5 text-gray-100 hover:bg-[var(--color-accent-secondary)]/80 transition-all duration-200 rounded-lg shadow-sm",
                  location === item.href 
                    ? "bg-[var(--color-accent-secondary)] text-white shadow-md transform translate-x-1" 
                    : "hover:translate-x-1"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
        
        <div className="p-5 border-t border-[#88a65e]/30 mt-4 bg-[#88a65e]/40 backdrop-blur">
          <div className="flex items-center">
            <Avatar className="h-11 w-11 ring-2 ring-white/30 shadow-lg">
              <AvatarImage src="" alt={user?.name || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-[#88a65e] to-[#7a9354] text-white font-medium">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-200 flex items-center mt-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-1.5"></span>
                {user?.role === UserRole.ADMIN ? "Administrador" : "Leitor"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleLogout}
            className="w-full mt-5 bg-gradient-to-r from-[#88a65e]/80 to-[#88a65e] hover:from-[#8c2318] hover:to-[#8c2318] text-white shadow-md transition-all duration-300 border-none"
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
          "fixed inset-y-0 left-0 z-50 w-full bg-[var(--color-bg-sidebar)] text-white transform transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#88a65e]">
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
                  "flex items-center px-4 py-3 text-white hover:bg-[var(--color-accent-secondary)] transition-colors duration-200 rounded-md",
                  location === item.href && "bg-[var(--color-accent-secondary)]"
                )}
                onClick={toggleMobileMenu}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 w-full px-4 py-4 border-t border-[#88a65e]">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="" alt={user?.name || "User"} />
              <AvatarFallback className="bg-[#88a65e] text-white">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-200">
                {user?.role === UserRole.ADMIN ? "Administrador" : "Leitor"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleLogout}
            className="w-full mt-4 bg-[#88a65e] hover:bg-[#8c2318] border border-white"
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
        <header className="bg-[var(--color-bg-header)] shadow-sm relative z-10 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                className="md:hidden text-gray-500 hover:text-gray-600 focus:outline-none mr-3 bg-[#f2f7f2] p-2 rounded-lg shadow-sm"
                onClick={toggleMobileMenu}
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-[var(--color-accent-primary)] tracking-tight">{title}</h1>
            </div>
            
            <div className="md:hidden flex items-center">
              <Avatar className="h-8 w-8 ring-2 ring-[var(--color-accent-primary)]/20 shadow-md">
                <AvatarFallback className="bg-[var(--color-accent-primary)] text-white text-xs">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg-main)] p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
