import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import * as schema from './shared/schema.js';
import ws from 'ws';

// Configuração para o neon usar websocket
neonConfig.webSocketConstructor = ws;

// Verificar se DATABASE_URL está definido
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined. Please check your environment variables.");
  process.exit(1);
}

console.log("Connecting to database...");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const { users } = schema;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

async function resetAdmin() {
  try {
    // Generate hashed password
    const password = "admin123";
    const hashedPassword = await hashPassword(password);
    
    // Verificar se já existe um usuário admin
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (existingAdmin.length > 0) {
      // Atualizar o usuário admin existente
      const [updatedAdmin] = await db.update(users)
        .set({
          password: hashedPassword,
          name: "Administrador",
          email: "admin@auralis.com",
          role: "ADMIN",
          actingDepartment: "ADMINISTRATIVO",
          assignedLocations: ["MARACAJU"]
        })
        .where(eq(users.username, "admin"))
        .returning();
      
      console.log("Admin user updated successfully:", updatedAdmin);
    } else {
      // Criar um novo usuário admin
      const [newAdmin] = await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        name: "Administrador",
        email: "admin@auralis.com",
        role: "ADMIN",
        actingDepartment: "ADMINISTRATIVO",
        assignedLocations: ["MARACAJU"]
      }).returning();
      
      console.log("Admin user created successfully:", newAdmin);
    }
    
    console.log("Admin login credentials:");
    console.log("Username: admin");
    console.log("Password: admin123");
    
  } catch (error) {
    console.error("Error resetting admin user:", error);
  } finally {
    process.exit(0);
  }
}

resetAdmin();