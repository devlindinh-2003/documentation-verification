import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: () => {
        const pool = new Pool({
          connectionString:
            process.env.DATABASE_URL ||
            'postgresql://postgres:postgres@localhost:5432/document_verification',
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
