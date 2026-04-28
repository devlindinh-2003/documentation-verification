import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as argon2 from 'argon2';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

// Load env before anything else
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local',
});

async function seed() {
  // STEP 0: ENVIRONMENT CHECK
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    console.error('❌ ERROR: This script CANNOT be run in production environment!');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  console.log(`⏳ Starting database reset and seed in ${nodeEnv} environment...`);

  const pool = new Pool({
    connectionString,
  });

  const db = drizzle(pool, { schema });

  try {
    // STEP 1: CLEAR DATABASE (Truncate all tables with CASCADE)
    console.log('🗑️ Clearing existing data...');

    // We use raw SQL to truncate all tables in the correct order or with CASCADE
    // This preserves the schema structure while removing all records.
    await db.execute(
      sql`TRUNCATE TABLE audit_events, notifications, verification_records, users RESTART IDENTITY CASCADE`,
    );

    console.log('✅ Data cleared successfully');

    // STEP 2 & 3: SEED DEFAULT USERS (with hashed passwords)
    console.log('🌱 Seeding default users...');

    const sellerPassword = await argon2.hash('password123');
    const adminPassword = await argon2.hash('password123');

    const SELLER_ID = '00000000-0000-0000-0000-000000000001';
    const ADMIN_ID = '00000000-0000-0000-0000-000000000002';

    // Create Seller
    await db.insert(schema.users).values({
      id: SELLER_ID,
      email: 'seller@example.com',
      passwordHash: sellerPassword,
      role: 'seller',
    });

    // Create Admin
    await db.insert(schema.users).values({
      id: ADMIN_ID,
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'admin',
    });

    console.log('✅ Default users seeded successfully');
    console.log(`   - Seller: seller@example.com (ID: ${SELLER_ID})`);
    console.log(`   - Admin: admin@example.com (ID: ${ADMIN_ID})`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
