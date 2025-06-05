import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

// Para modo de demonstração sem banco de dados real
const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.DATABASE_URL;

if (!isDemoMode && !process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use uma URL de demonstração se não houver banco de dados configurado
const connectionString = process.env.DATABASE_URL || 'postgresql://demo:demo@localhost:5432/demo';

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });