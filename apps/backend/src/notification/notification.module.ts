import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationWorker } from './notification.worker';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notification-jobs',
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationWorker],
  exports: [NotificationService],
})
export class NotificationModule {}
