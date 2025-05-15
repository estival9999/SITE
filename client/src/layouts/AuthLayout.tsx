import { ReactNode } from "react";
import Logo from "@/components/Logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#5e8c6a] to-[#88a65e]">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-gradient-to-r from-[#304536] to-[#5e8c6a] p-5 rounded-xl shadow-md">
              <Logo size="large" withText={true} className="text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Comunicados Corporativos</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Acesse sua conta para visualizar os comunicados
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
