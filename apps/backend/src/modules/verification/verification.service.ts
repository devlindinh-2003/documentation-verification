import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { StateMachineService } from './state-machine.service';
import { UploadUrlDto } from './dto/upload-url.dto';
import { randomUUID } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DRIZZLE } from '../../database/db.module';
import { verificationRecords, users } from '../../database/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { ConflictException } from '@nestjs/common';

export const MAX_PENDING_DOCUMENTS = 5;

@Injectable()
export class VerificationService {
  constructor(
    private readonly stateMachine: StateMachineService,
    private readonly storageService: StorageService,
    @InjectQueue('verification-jobs') private verificationQueue: Queue,
    @Inject(DRIZZLE) private readonly db: any,
  ) {}

  async generateUploadUrl(dto: UploadUrlDto) {
    const documentKey = `${randomUUID()}-${dto.fileName}`;

    const { signedUrl, token } = await this.storageService.createSignedUploadUrl(documentKey);

    return {
      uploadUrl: signedUrl,
      documentKey,
      token,
    };
  }

  async confirmUploadAndStartVerification(documentKey: string, sellerId: string) {
    const result = await this.db.transaction(async (tx: any) => {
      // 1. Lock the user row to serialize verification requests for this seller
      // This prevents race conditions where multiple parallel uploads could bypass the limit
      await tx.select().from(users).where(eq(users.id, sellerId)).for('update');

      // 2. Count active verifications (pending or processing)
      const activeRecords = await tx
        .select()
        .from(verificationRecords)
        .where(
          and(
            eq(verificationRecords.sellerId, sellerId),
            inArray(verificationRecords.status, ['pending', 'processing']),
          ),
        );

      if (activeRecords.length >= MAX_PENDING_DOCUMENTS) {
        throw new ConflictException(`Maximum ${MAX_PENDING_DOCUMENTS} pending documents reached`);
      }

      const metadata = await this.storageService.getFileMetadata(documentKey);
      if (!metadata) {
        throw new BadRequestException('Document not found in storage');
      }

      if (metadata.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Document exceeds 10MB limit');
      }

      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(metadata.mime)) {
        throw new BadRequestException('Invalid MIME type');
      }

      const record = await this.stateMachine.createPendingRecord(
        sellerId,
        documentKey,
        metadata.name,
        metadata.size,
        metadata.mime,
        tx, // Pass the transaction context
      );

      return record;
    });

    const externalJobId = randomUUID();

    await this.verificationQueue.add(
      'verify-document',
      {
        recordId: result.id,
        sellerId: result.sellerId,
        documentKey: result.documentKey,
        documentName: result.documentName,
        documentSize: result.documentSize,
        version: result.version,
        externalJobId,
      },
      {
        jobId: externalJobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000,
        },
      },
    );

    return { recordId: result.id, status: result.status };
  }

  async getAllVerifications(sellerId: string) {
    return this.db
      .select()
      .from(verificationRecords)
      .where(eq(verificationRecords.sellerId, sellerId));
  }

  async getMyVerification(sellerId: string) {
    const records = await this.db
      .select()
      .from(verificationRecords)
      .where(eq(verificationRecords.sellerId, sellerId))
      .limit(1);
    return records[0] || null;
  }
}
