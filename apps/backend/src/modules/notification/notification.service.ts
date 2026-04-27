import {
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DRIZZLE } from '../../database/db.module';
import { notifications, verificationRecords } from '../../database/schema';
import { eq, and, desc, count } from 'drizzle-orm';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue('notification-jobs') private notificationQueue: Queue,
    @Inject(DRIZZLE) private readonly db: any,
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

  async createNotification(data: {
    userId: string;
    title: string;
    body: string;
    type: 'VERIFICATION_RESULT';
    metadata: { recordId: string; status: string };
  }) {
    // Idempotency check: recordId + status
    // Fetch notifications for the user and check metadata in memory
    const existing = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, data.userId));

    const duplicate = existing.find(
      (n: any) =>
        n.metadata.recordId === data.metadata.recordId &&
        n.metadata.status === data.metadata.status,
    );

    if (duplicate) {
      this.logger.log(
        `Notification already exists for record ${data.metadata.recordId} and status ${data.metadata.status}`,
      );
      return duplicate;
    }

    const [notif] = await this.db
      .insert(notifications)
      .values({
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        metadata: data.metadata,
      })
      .returning();

    return notif;
  }

  async getNotifications(userId: string, limit = 10, offset = 0) {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUnreadCount(userId: string) {
    const [result] = await this.db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    return result.count;
  }

  async markAsRead(notificationId: string, userId: string) {
    const [notif] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId));

    if (!notif) {
      throw new NotFoundException('Notification not found');
    }

    if (notif.userId !== userId) {
      throw new ForbiddenException('You do not own this notification');
    }

    const [updated] = await this.db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, notificationId))
      .returning();

    return updated;
  }

  async markAllRead(userId: string) {
    return this.db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
      .returning();
  }
}
