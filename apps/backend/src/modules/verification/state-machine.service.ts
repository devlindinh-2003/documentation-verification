import {
  Injectable,
  Inject,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DRIZZLE } from '../../database/db.module';
import { verificationRecords, auditEvents } from '../../database/schema';
import * as schema from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class StateMachineService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Initializes a verification record in 'pending' state.
   * This is the entry point for all new document verification requests.
   */
  async createPendingRecord(
    sellerId: string,
    documentKey: string,
    documentName: string,
    documentSize: number,
    documentMime: string,
    existingTx?: any, // Using any for transaction compatibility across Drizzle versions
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

      // Audit every state change, even the initial creation
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

  /**
   * Orchestrates state transitions with optimistic locking and audit logging.
   * Transitions are guarded by validateTransition() to ensure logical consistency.
   */
  async transition(
    recordId: string,
    currentVersion: number,
    toStatus: typeof verificationRecords.$inferSelect.status,
    actorId: string,
    actorRole: 'seller' | 'admin' | 'system',
    eventType: string,
    metadata: Record<string, any> = {},
    extraUpdates: Partial<typeof verificationRecords.$inferSelect> = {},
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

      // Optimistic locking: verify the version hasn't changed since we last read it
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

      // Record the transition in the audit trail
      await tx.insert(auditEvents).values({
        recordId: updatedRecord.id,
        actorId,
        actorRole,
        eventType,
        fromStatus: currentRecord.status,
        toStatus: toStatus,
        metadata,
      });

      // Emit events for cross-module side effects (e.g., notifications)
      if (['verified', 'rejected', 'approved', 'denied', 'inconclusive'].includes(toStatus)) {
        this.eventEmitter.emit('verification.finalised', updatedRecord);
      }

      return updatedRecord;
    });
  }

  /**
   * Enforces the business rules for state transitions.
   * Terminal states (verified, rejected, approved, denied) cannot be transitioned out of.
   */
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
      throw new UnprocessableEntityException(`Invalid state transition from ${from} to ${to}`);
    }
  }
}
