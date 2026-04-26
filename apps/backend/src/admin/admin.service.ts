import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DRIZZLE } from '../db/db.module';
import { verificationRecords, auditEvents } from '../db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { StateMachineService } from '../document-verification/state-machine.service';
import { DecisionDto } from './dto/decision.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly stateMachine: StateMachineService,
  ) {}

  async listVerifications(
    status?: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    let query = this.db.select().from(verificationRecords);
    if (status) {
      query = query.where(eq(verificationRecords.status, status as any));
    }
    return query
      .orderBy(desc(verificationRecords.createdAt))
      .limit(limit)
      .offset(offset);
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

    // In reality, call AWS SDK to generate a presigned GET URL for record.documentKey
    const mockSignedGetUrl = `https://mock-storage.local/download/${record.documentKey}?sig=temp`;
    return { url: mockSignedGetUrl };
  }

  async claimRecord(recordId: string, adminId: string) {
    return await this.db.transaction(async (tx: any) => {
      const [record] = await tx
        .select()
        .from(verificationRecords)
        .where(eq(verificationRecords.id, recordId));
      if (!record) throw new NotFoundException('Record not found');

      if (record.lockedBy && record.lockedBy !== adminId) {
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
        if (record.lockedAt && record.lockedAt > tenMinsAgo) {
          throw new ConflictException(
            'Record is currently locked by another admin',
          );
        }
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
        throw new ConflictException(
          'Record is currently locked by another admin',
        );
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
