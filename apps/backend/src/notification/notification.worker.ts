import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../db/db.module';
import { verificationRecords, users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Processor('notification-jobs')
@Injectable()
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(@Inject(DRIZZLE) private readonly db: any) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { recordId, sellerId, status } = job.data;
    this.logger.log(
      `Sending email notification to seller ${sellerId} for record ${recordId} (status: ${status})`,
    );

    const [seller] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, sellerId));
    if (!seller) {
      this.logger.warn(`Seller not found: ${sellerId}`);
      return;
    }

    try {
      await this.mockSendEmail(
        seller.email,
        `Your verification status is now: ${status}`,
      );

      await this.db
        .update(verificationRecords)
        .set({ notifiedAt: new Date() })
        .where(eq(verificationRecords.id, recordId));

      this.logger.log(`Notification sent and logged for record ${recordId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      throw error;
    }
  }

  private async mockSendEmail(to: string, body: string): Promise<void> {
    const { setTimeout } = await import('timers/promises');
    await setTimeout(500);
    if (Math.random() < 0.1) {
      throw new Error('SMTP timeout');
    }
  }
}
