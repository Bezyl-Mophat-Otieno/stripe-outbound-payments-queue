import { users } from '@/db/schema/users';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { Pool } from 'pg';

type Schema = {
  users: typeof users;
};

export const schema: Schema = {
  users,
};

let dbInstance: ReturnType<typeof drizzle>;
let pool: Pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

function getDbInstance() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}

// Utility to Generate Zod Schemas from Drizzle Schema
export function createModelSchemas<T extends keyof typeof schema>(tableName: T) {
  const table = schema[tableName];

  return {
    insert: createInsertSchema(table),
    select: createSelectSchema(table),
    update: createUpdateSchema(table),
    delete: createUpdateSchema(table),
  };
}

export const db = getDbInstance();
