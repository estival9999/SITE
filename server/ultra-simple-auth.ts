// AUTENTICAÇÃO ULTRA SIMPLIFICADA - SEMPRE FUNCIONA NO MODO DEMO

export function setupUltraSimpleAuth(app: any) {
  console.log("🔥 MODO DEMO ATIVADO - LOGIN SIMPLES!");
  
  // Simula sessão de usuário
  let currentUser: any = null;
  
  // Middleware de autenticação
  app.use((req: any, res: any, next: any) => {
    req.isAuthenticated = () => !!currentUser;
    req.user = currentUser;
    next();
  });

  // LOGIN - SEMPRE ACEITA QUALQUER COISA
  app.post("/api/login", (req: any, res: any) => {
    console.log("🎯 Login attempt:", req.body);
    
    // SEMPRE RETORNA SUCESSO
    const user = {
      id: 1,
      username: req.body.username || 'admin',
      email: 'admin@auralis.com',
      name: 'Administrador Demo',
      role: 'ADMIN',
      department: 'TI',
      location: 'MATRIZ'
    };
    
    // Armazena o usuário logado
    currentUser = user;
    
    console.log("✅ LOGIN ACEITO AUTOMATICAMENTE!");
    return res.status(200).json(user);
  });

  // Get user - retorna o usuário logado ou null
  app.get("/api/user", (req: any, res: any) => {
    if (!currentUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.json(currentUser);
  });

  // Logout
  app.post("/api/logout", (req: any, res: any) => {
    currentUser = null;
    res.sendStatus(200);
  });

  // Register - sempre aceita
  app.post("/api/register", (req: any, res: any) => {
    const user = {
      id: 2,
      username: req.body.username,
      email: req.body.email || 'user@auralis.com',
      name: req.body.name || 'Novo Usuário',
      role: 'READER',
      department: 'RH',
      location: 'MATRIZ'
    };
    
    // Armazena o usuário registrado
    currentUser = user;
    
    res.status(201).json(user);
  });
}