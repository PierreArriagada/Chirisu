// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Hacemos que DATABASE_URL sea obligatoria quitando .optional()
  DATABASE_URL: z.string().url("La DATABASE_URL debe ser una URL válida"), 
  
  // Puedes agregar sslmode a la URL de conexión si es necesario, ej: ?sslmode=require
  // PGSSLMODE: z.enum(['disable', 'prefer', 'require']).optional(),

  DEMO_USER_ID: z.string().optional(),
  NEXTAUTH_SECRET: z.string(), // El secret de NextAuth debería ser obligatorio
  NEXTAUTH_URL: z.string().url().optional(),
});

// parse() lanzará un error si las variables no coinciden con el esquema
export const env = envSchema.parse(process.env);