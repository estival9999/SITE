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
      <div className="bg-[#5e8c6a] text-white w-64 flex-shrink-0 hidden md:flex md:flex-col">
        <div className="flex items-center justify-center h-16 border-b border-[#88a65e]">
          <Logo size="medium" withText />
        </div>

        <nav className="mt-6 flex-1">
          <div className="space-y-1 px-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-6 py-3 text-gray-100 hover:bg-[#88a65e] transition-colors duration-200 rounded-md",
                  location === item.href && "bg-[#88a65e] text-white"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
        
        <div className="p-4 border-t border-[#88a65e]">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="" alt={user?.name || "User"} />
              <AvatarFallback className="bg-[#88a65e] text-white">{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-200">
                {user?.role === UserRole.ADMIN ? "Administrador" : "Leitor"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleLogout}
            className="w-full mt-4 bg-[#5e8c6a] hover:bg-[#8c2318] border border-white"
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
          "fixed inset-y-0 left-0 z-50 w-full bg-[#5e8c6a] text-white transform transition-transform duration-300 ease-in-out md:hidden",
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
                  "flex items-center px-4 py-3 text-white hover:bg-[#88a65e] transition-colors duration-200 rounded-md",
                  location === item.href && "bg-[#88a65e]"
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
              <AvatarFallback className="bg-[#88a65e] text-white">{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-200">
                {user?.role === UserRole.ADMIN ? "Administrador" : "Leitor"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleLogout}
            className="w-full mt-4 bg-[#5e8c6a] hover:bg-[#8c2318] border border-white"
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
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                className="md:hidden text-gray-500 hover:text-gray-600 focus:outline-none mr-2"
                onClick={toggleMobileMenu}
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-[#5e8c6a]">{title}</h1>
            </div>
            
            <div className="md:hidden">
              <span className="text-sm text-gray-600">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
