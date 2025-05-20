import { ReactNode } from "react";
import Logo from "@/components/Logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-md w-full space-y-6 bg-[#121212] p-10 rounded-lg shadow-lg border border-[#2a2a2a]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-[#212121]">
              <Logo size="medium" className="text-white" withText={true} />
            </div>
          </div>
          <h2 className="mt-6 text-center text-4xl font-bold text-white">Comunicados Corporativos</h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Acesse sua conta para visualizar os comunicados
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
