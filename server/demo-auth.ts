// Autenticação simplificada para modo DEMO
export function setupDemoAuth(app: any) {
  // Middleware simples para modo demo
  app.use((req: any, res: any, next: any) => {
    // No modo demo, sempre considera autenticado
    if (process.env.DEMO_MODE === 'true') {
      req.isAuthenticated = () => true;
      req.user = { id: 1, username: 'admin', role: 'ADMIN' };
    }
    next();
  });

  // Login simplificado para demo
  app.post("/api/login", (req: any, res: any) => {
    const { username, password } = req.body;
    
    console.log(`Login attempt - Username: ${username}, Password: ${password}`);
    
    // Validação das credenciais demo
    if (username === 'admin' && password === 'admin') {
      const user = {
        id: 1,
        username: 'admin',
        email: 'admin@auralis.com',
        name: 'Administrador',
        role: 'ADMIN',
        department: 'TI',
        location: 'MATRIZ'
      };
      
      // Simula sessão
      req.session = req.session || {};
      req.session.user = user;
      
      console.log('Admin login successful');
      return res.json(user);
    }
    
    if (username === 'user' && password === 'user') {
      const user = {
        id: 2,
        username: 'user',
        email: 'user@auralis.com',
        name: 'João Silva',
        role: 'READER',
        department: 'RH',
        location: 'MATRIZ'
      };
      
      // Simula sessão
      req.session = req.session || {};
      req.session.user = user;
      
      console.log('User login successful');
      return res.json(user);
    }
    
    console.log('Login failed - invalid credentials');
    return res.status(401).json({ message: "Usuário ou senha incorretos" });
  });

  // Logout
  app.post("/api/logout", (req: any, res: any) => {
    if (req.session) {
      req.session.destroy(() => {
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  });

  // Get current user
  app.get("/api/user", (req: any, res: any) => {
    if (process.env.DEMO_MODE === 'true') {
      // Retorna usuário admin por padrão no modo demo
      return res.json({
        id: 1,
        username: 'admin',
        email: 'admin@auralis.com',
        name: 'Administrador',
        role: 'ADMIN',
        department: 'TI',
        location: 'MATRIZ'
      });
    }
    
    if (req.session && req.session.user) {
      return res.json(req.session.user);
    }
    
    return res.status(401).json({ message: "Not authenticated" });
  });
}