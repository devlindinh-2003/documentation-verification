import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue('notification-jobs') private notificationQueue: Queue,
  ) {}

  @OnEvent('verification.finalised')
  async handleVerificationFinalised(record: any) {
    this.logger.log(
      `Queueing notification for record ${record.id} with status ${record.status}`,
    );

    await this.notificationQueue.add(
      'send-notification',
      {
        recordId: record.id,
        sellerId: record.sellerId,
        status: record.status,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000,
        },
      },
    );
  }
}
