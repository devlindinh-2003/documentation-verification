import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/db.module';
import { verificationRecords, users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { NotificationService } from './notification.service';

@Processor('notification-jobs')
@Injectable()
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { recordId, sellerId, status } = job.data;
    this.logger.log(
      `Processing notification for seller ${sellerId} for record ${recordId} (status: ${status})`,
    );

    const [seller] = await this.db.select().from(users).where(eq(users.id, sellerId));

    if (!seller) {
      this.logger.warn(`Seller not found: ${sellerId}`);
      return;
    }

    try {
      // Create in-app notification
      await this.notificationService.createNotification({
        userId: sellerId,
        title: 'Verification Update',
        body: `Your verification status is now: ${status}`,
        type: 'VERIFICATION_RESULT',
        metadata: { recordId, status },
      });

      // Update verificationRecords.notifiedAt
      await this.db
        .update(verificationRecords)
        .set({ notifiedAt: new Date() })
        .where(eq(verificationRecords.id, recordId));

      this.logger.log(`Notification created and record ${recordId} updated`);
    } catch (error: any) {
      this.logger.error(`Failed to process notification: ${error.message}`);
      throw error;
    }
  }
}
