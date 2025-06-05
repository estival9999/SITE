import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "../shared/schema.js";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string) {
  // Gera um salt e hash a senha usando bcrypt
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePasswords(supplied: string, stored: string) {
  // Modo DEMO: aceita senhas específicas
  if (process.env.DEMO_MODE === 'true') {
    // Para o usuário admin, aceita senha "admin"
    // Para o usuário user, aceita senha "user"
    // Isso é checado no passport strategy abaixo
    return true; // No modo demo, validamos a senha no strategy
  }
  
  if (!stored) {
    console.error("Stored password is null or undefined");
    return false;
  }
  
  try {
    // Em produção, usa bcrypt
    if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
      const match = await bcrypt.compare(supplied, stored);
      return match;
    }
    
    console.error("Password format not recognized");
    return false;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`Login attempt with non-existent username: ${username}`);
          return done(null, false, { message: "Usuário ou senha incorretos" });
        }
        
        // Verifica se o objeto user e a senha são válidos
        if (!user.passwordHash) {
          console.error(`User ${username} has invalid password stored`);
          return done(null, false, { message: "Erro na autenticação, contate o administrador" });
        }
        
        // No modo DEMO, valida senhas específicas
        if (process.env.DEMO_MODE === 'true') {
          const validCredentials = (
            (username === 'admin' && password === 'admin') ||
            (username === 'user' && password === 'user')
          );
          
          if (!validCredentials) {
            console.log(`Invalid demo credentials for user: ${username}`);
            return done(null, false, { message: "Usuário ou senha incorretos" });
          }
          
          console.log(`Demo user ${username} authenticated successfully`);
          return done(null, user);
        }
        
        // Modo produção: usa bcrypt
        const isPasswordValid = await comparePasswords(password, user.passwordHash);
        
        if (!isPasswordValid) {
          console.log(`Invalid password attempt for user: ${username}`);
          return done(null, false, { message: "Usuário ou senha incorretos" });
        }
        
        return done(null, user);
      } catch (error) {
        console.error("Login error:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    if (!user || !user.id) {
      console.error("Cannot serialize invalid user:", user);
      return done(new Error("Invalid user data"));
    }
    return done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.error(`User with id ${id} not found during deserialization`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed:", info?.message || "Unknown reason");
        return res.status(401).json({ message: info?.message || "Falha na autenticação" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          return next(err);
        }
        console.log("User authenticated successfully:", user.username);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
