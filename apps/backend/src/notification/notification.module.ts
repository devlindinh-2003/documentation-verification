import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationWorker } from './notification.worker';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notification-jobs',
    }),
  ],
  providers: [NotificationService, NotificationWorker],
})
export class NotificationModule {}
