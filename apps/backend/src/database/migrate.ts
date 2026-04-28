import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env before anything else
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local',
});

export async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  console.log('⏳ Running migrations...');

  const pool = new Pool({
    connectionString,
  });

  const db = drizzle(pool);

  try {
    // This will look for the migrations folder in the root of the apps/backend directory
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), 'drizzle'),
    });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migrations failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Allow running as a standalone script
if (require.main === module) {
  runMigrations().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
