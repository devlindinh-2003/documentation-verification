import { Injectable, Inject, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { DRIZZLE } from '../../database/db.module';
import { verificationRecords, auditEvents } from '../../database/schema';
import { eq, desc, asc, and, count } from 'drizzle-orm';
import { StateMachineService } from '../verification/state-machine.service';
import { StorageService } from '../storage/storage.service';
import { DecisionDto } from './dto/decision.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly stateMachine: StateMachineService,
    private readonly storageService: StorageService,
  ) {}

  async listVerifications(status?: string, limit: number = 20, offset: number = 0) {
    let whereClause: any = undefined;
    if (status) {
      whereClause = eq(verificationRecords.status, status as any);
    }

    const data = await this.db
      .select()
      .from(verificationRecords)
      .where(whereClause)
      .orderBy(desc(verificationRecords.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(verificationRecords)
      .where(whereClause);

    return {
      data,
      total: totalResult.count,
    };
  }

  async getVerificationById(recordId: string) {
    const [record] = await this.db
      .select()
      .from(verificationRecords)
      .where(eq(verificationRecords.id, recordId));
    if (!record) throw new NotFoundException('Record not found');
    return record;
  }

  async getHistory(recordId: string) {
    return this.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.recordId, recordId))
      .orderBy(asc(auditEvents.createdAt));
  }

  async getDocumentUrl(recordId: string) {
    const [record] = await this.db
      .select()
      .from(verificationRecords)
      .where(eq(verificationRecords.id, recordId));
    if (!record) throw new NotFoundException('Record not found');

    const signedUrl = await this.storageService.getSignedUrl(record.documentKey);
    return { url: signedUrl };
  }

  async claimRecord(recordId: string, adminId: string) {
    return await this.db.transaction(async (tx: any) => {
      const [record] = await tx
        .select()
        .from(verificationRecords)
        .where(eq(verificationRecords.id, recordId));
      if (!record) throw new NotFoundException('Record not found');

      // In a single-admin setup, we allow taking over the lock at any time.
      // The audit history will still track the state changes.
      if (record.lockedBy && record.lockedBy !== adminId) {
        this.logger.log(`Admin ${adminId} is taking over lock from ${record.lockedBy}`);
      }

      const [updated] = await tx
        .update(verificationRecords)
        .set({
          lockedBy: adminId,
          lockedAt: new Date(),
          version: record.version + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(verificationRecords.id, recordId),
            eq(verificationRecords.version, record.version),
          ),
        )
        .returning();

      if (!updated) {
        throw new ConflictException('Concurrent modification detected');
      }

      return updated;
    });
  }

  async submitDecision(recordId: string, adminId: string, dto: DecisionDto) {
    const [record] = await this.db
      .select()
      .from(verificationRecords)
      .where(eq(verificationRecords.id, recordId));
    if (!record) throw new NotFoundException('Record not found');

    if (record.lockedBy !== adminId) {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (
        record.lockedBy &&
        record.lockedBy !== adminId &&
        record.lockedAt &&
        record.lockedAt > tenMinsAgo
      ) {
        throw new ConflictException('Record is currently locked by another admin');
      }
    }

    return await this.stateMachine.transition(
      recordId,
      dto.version,
      dto.decision,
      adminId,
      'admin',
      'admin_decision',
      { reason: dto.reason },
      {
        reviewedBy: adminId,
        reviewReason: dto.reason,
        lockedBy: null,
        lockedAt: null,
      },
    );
  }
}
