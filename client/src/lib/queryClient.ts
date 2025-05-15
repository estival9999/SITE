import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Tenta analisar como JSON primeiro
      const errorData = await res.json();
      const errorMessage = errorData.message || errorData.error || `${res.status}: ${res.statusText}`;
      throw new Error(errorMessage);
    } catch (e) {
      // Se não for JSON, use o texto
      try {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      } catch (textError) {
        // Fallback se não conseguirmos obter o texto
        throw new Error(`${res.status}: ${res.statusText}`);
      }
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  contentType: "json" | "formdata" = "json",
): Promise<Response> {
  let headers: Record<string, string> = {};
  let body: any = undefined;
  
  if (data) {
    if (contentType === "json" && !(data instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    } else {
      // Para FormData, não definimos Content-Type
      // O navegador vai definir automaticamente com o boundary correto
      body = data;
    }
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include",
    });

    // Não chama throwIfResNotOk aqui para permitir que o chamador lide com os erros
    // Isso é particularmente útil para o login onde queremos acessar o corpo da resposta
    return res;
  } catch (error) {
    console.error(`API request error (${method} ${url}):`, error);
    throw new Error("Falha na conexão com o servidor. Verifique sua conexão e tente novamente.");
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (!res.ok) {
        await throwIfResNotOk(res);
      }
      
      return await res.json();
    } catch (error) {
      console.error(`Query error (${queryKey[0]}):`, error);
      throw error; // Repassar o erro para que react-query lide com ele
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
