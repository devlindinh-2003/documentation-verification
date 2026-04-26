import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DRIZZLE } from '../db/db.module';
import { verificationRecords } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const db = app.get(DRIZZLE);
  const verificationQueue = app.get<Queue>(getQueueToken('verification-jobs'));

  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

  const orphanedRecords = await db
    .select()
    .from(verificationRecords)
    .where(
      and(
        eq(verificationRecords.status, 'pending'),
        lt(verificationRecords.createdAt, thirtyMinsAgo),
      ),
    );

  console.log(`Found ${orphanedRecords.length} orphaned pending records.`);

  for (const record of orphanedRecords) {
    const { randomUUID } = require('crypto');
    const externalJobId = randomUUID();

    await verificationQueue.add(
      'verify-document',
      {
        recordId: record.id,
        documentKey: record.documentKey,
        version: record.version,
        externalJobId,
      },
      {
        jobId: externalJobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
      },
    );

    console.log(`Re-enqueued record ${record.id} with job ID ${externalJobId}`);
  }

  await app.close();
}
bootstrap();
