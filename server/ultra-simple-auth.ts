// AUTENTICAÇÃO ULTRA SIMPLIFICADA - SEMPRE FUNCIONA NO MODO DEMO

export function setupUltraSimpleAuth(app: any) {
  console.log("🔥 MODO DEMO ATIVADO - LOGIN SEMPRE ACEITO!");
  
  // Middleware que sempre autentica
  app.use((req: any, res: any, next: any) => {
    req.isAuthenticated = () => true;
    req.user = {
      id: 1,
      username: 'admin',
      email: 'admin@auralis.com',
      name: 'Administrador Demo',
      role: 'ADMIN',
      department: 'TI',
      location: 'MATRIZ'
    };
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
    
    console.log("✅ LOGIN ACEITO AUTOMATICAMENTE!");
    return res.status(200).json(user);
  });

  // Get user - sempre retorna admin
  app.get("/api/user", (req: any, res: any) => {
    return res.json({
      id: 1,
      username: 'admin',
      email: 'admin@auralis.com',
      name: 'Administrador Demo',
      role: 'ADMIN',
      department: 'TI',
      location: 'MATRIZ'
    });
  });

  // Logout
  app.post("/api/logout", (req: any, res: any) => {
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
    res.status(201).json(user);
  });
}