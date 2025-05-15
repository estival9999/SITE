import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

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