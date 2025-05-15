import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './server/db.js';
import { users } from './shared/schema.js';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  try {
    // Generate hashed password
    const password = "password";
    const hashedPassword = await hashPassword(password);
    
    // Create the admin user
    const [admin] = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      name: "Administrador",
      email: "admin@auralis.com",
      role: "ADMIN",
      actingDepartment: "ADMINISTRATIVO",
      assignedLocations: ["MARACAJU"]
    }).returning();
    
    console.log("Admin user created successfully:", admin);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdmin();