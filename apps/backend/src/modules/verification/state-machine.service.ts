import {
  Injectable,
  Inject,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DRIZZLE } from '../../database/db.module';
import { verificationRecords, auditEvents } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StateMachineService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPendingRecord(
    sellerId: string,
    documentKey: string,
    documentName: string,
    documentSize: number,
    documentMime: string,
    existingTx?: any,
  ) {
    const runner = async (tx: any) => {
      const [newRecord] = await tx
        .insert(verificationRecords)
        .values({
          sellerId,
          status: 'pending',
          documentKey,
          documentName,
          documentSize,
          documentMime,
        })
        .returning();

      await tx.insert(auditEvents).values({
        recordId: newRecord.id,
        actorId: sellerId,
        actorRole: 'seller',
        eventType: 'document_uploaded',
        fromStatus: 'pending',
        toStatus: 'pending',
        metadata: {
          documentKey,
          documentSize,
        },
      });

      return newRecord;
    };

    if (existingTx) {
      return await runner(existingTx);
    }
    return await this.db.transaction(runner);
  }

  async transition(
    recordId: string,
    currentVersion: number,
    toStatus:
      | 'processing'
      | 'verified'
      | 'rejected'
      | 'inconclusive'
      | 'pending'
      | 'approved'
      | 'denied',
    actorId: string,
    actorRole: 'seller' | 'admin' | 'system',
    eventType: string,
    metadata: any = {},
    extraUpdates: any = {},
  ) {
    return await this.db.transaction(async (tx: any) => {
      const [currentRecord] = await tx
        .select()
        .from(verificationRecords)
        .where(eq(verificationRecords.id, recordId));

      if (!currentRecord) {
        throw new UnprocessableEntityException('Record not found');
      }

      this.validateTransition(currentRecord.status, toStatus);

      const [updatedRecord] = await tx
        .update(verificationRecords)
        .set({
          status: toStatus,
          version: currentRecord.version + 1,
          updatedAt: new Date(),
          ...extraUpdates,
        })
        .where(
          and(
            eq(verificationRecords.id, recordId),
            eq(verificationRecords.version, currentVersion),
          ),
        )
        .returning();

      if (!updatedRecord) {
        throw new ConflictException('Concurrent modification detected');
      }

      await tx.insert(auditEvents).values({
        recordId: updatedRecord.id,
        actorId,
        actorRole,
        eventType,
        fromStatus: currentRecord.status,
        toStatus: toStatus,
        metadata,
      });

      if (
        ['verified', 'rejected', 'approved', 'denied', 'inconclusive'].includes(
          toStatus,
        )
      ) {
        this.eventEmitter.emit('verification.finalised', updatedRecord);
      }

      return updatedRecord;
    });
  }

  private validateTransition(from: string, to: string) {
    const validTransitions: Record<string, string[]> = {
      pending: ['processing'],
      processing: ['verified', 'rejected', 'inconclusive', 'pending'],
      inconclusive: ['approved', 'denied'],
      verified: [],
      rejected: [],
      approved: [],
      denied: [],
    };

    if (!validTransitions[from]?.includes(to)) {
      throw new UnprocessableEntityException(
        `Invalid state transition from ${from} to ${to}`,
      );
    }
  }
}
