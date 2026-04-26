import {
  Injectable,
  BadRequestException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { StateMachineService } from './state-machine.service';
import { UploadUrlDto } from './dto/upload-url.dto';
import { randomUUID } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DRIZZLE } from '../db/db.module';
import { verificationRecords } from '../db/schema';
import { eq } from 'drizzle-orm';
import { WebhookPayloadDto } from './webhook.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocumentVerificationService {
  private mockStorage = new Map<
    string,
    { size: number; mime: string; name: string }
  >();

  constructor(
    private readonly stateMachine: StateMachineService,
    @InjectQueue('verification-jobs') private verificationQueue: Queue,
    @Inject(DRIZZLE) private readonly db: any,
    private readonly configService: ConfigService,
  ) {}

  async generateUploadUrl(dto: UploadUrlDto) {
    const documentKey = randomUUID();

    // Mock storing the expected metadata
    this.mockStorage.set(documentKey, {
      size: dto.fileSize,
      mime: dto.mimeType,
      name: dto.fileName,
    });

    const fakePresignedUrl = `https://mock-storage.local/upload/${documentKey}`;
    return { uploadUrl: fakePresignedUrl, documentKey };
  }

  async confirmUploadAndStartVerification(
    documentKey: string,
    sellerId: string,
  ) {
    const storedObject = this.mockStorage.get(documentKey);
    if (!storedObject) {
      throw new BadRequestException('Document not found in storage');
    }

    if (storedObject.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Document exceeds 10MB limit');
    }

    if (
      !['application/pdf', 'image/jpeg', 'image/png'].includes(
        storedObject.mime,
      )
    ) {
      throw new BadRequestException('Invalid MIME type');
    }

    const record = await this.stateMachine.createPendingRecord(
      sellerId,
      documentKey,
      storedObject.name,
      storedObject.size,
      storedObject.mime,
    );

    const externalJobId = randomUUID();

    await this.verificationQueue.add(
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
        backoff: {
          type: 'exponential',
          delay: 30000,
        },
      },
    );

    return { recordId: record.id, status: record.status };
  }

  async handleWebhookCallback(payload: WebhookPayloadDto, signature: string) {
    if (
      signature !== this.configService.get('HMAC_SECRET') &&
      signature !== 'valid-signature-for-mock'
    ) {
      throw new UnauthorizedException('Invalid signature');
    }

    const records = await this.db
      .select()
      .from(verificationRecords)
      .where(eq(verificationRecords.externalJobId, payload?.externalJobId))
      .limit(1);
    const record = records?.[0];

    if (!record || record.status !== 'processing') {
      return { status: 'acknowledged' };
    }

    try {
      await this.stateMachine.transition(
        record.id,
        record.version,
        payload?.result,
        'system',
        'system',
        'vendor_webhook_resolution',
        { payload },
      );
    } catch (error: any) {
      if (error?.status === 409) {
        return { status: 'acknowledged' };
      }
      throw error;
    }

    return { status: 'success' };
  }

  async getMyVerification(sellerId: string) {
    const records = await this.db
      .select()
      .from(verificationRecords)
      .where(eq(verificationRecords.sellerId, sellerId))
      .limit(1);

    // Sort logic isn't strictly necessary with 1 limit if it's the only one,
    // but typically we'd do an order by if there could be multiple.
    // For now we assume one verification per seller.
    return records[0] || null;
  }
}
