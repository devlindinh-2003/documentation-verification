import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { StateMachineService } from './state-machine.service';
import { MockVerificationService } from '../mock-verification/mock-verification.service';

@Processor('verification-jobs')
@Injectable()
export class VerificationWorker extends WorkerHost {
  private readonly logger = new Logger(VerificationWorker.name);

  constructor(
    private readonly stateMachine: StateMachineService,
    private readonly mockService: MockVerificationService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {

    const {
      recordId,
      sellerId,
      documentKey,
      version: currentVersion,
      externalJobId,
    } = job.data;

    this.logger.log(
      `[Job ${job.id}] Starting verification for record ${recordId} (version ${currentVersion})`,
    );

    try {
      this.logger.log(`[Job ${job.id}] Transitioning to 'processing'...`);
      await this.stateMachine.transition(
        recordId,
        currentVersion,
        'processing',
        sellerId,
        'system',
        'job_processing_started',
        { externalJobId, jobType: 'automated_verification' },
      );

      this.logger.log(
        `[Job ${job.id}] Calling mock verification service for record ${recordId}`,
      );
      const mockResponse = await this.mockService.verifyDocument(documentKey);
      
      const finalStatus = mockResponse.status.toLowerCase() as any;
      const eventType = this.mapStatusToEvent(mockResponse.status);

      this.logger.log(`[Job ${job.id}] Mock service returned: ${finalStatus}. Transitioning...`);
      await this.stateMachine.transition(
        recordId,
        currentVersion + 1,
        finalStatus,
        sellerId,
        'system',
        eventType,
        {
          confidence: mockResponse.confidence,
          message: mockResponse.message,
          externalJobId,
        },
      );

      this.logger.log(
        `[Job ${job.id}] Verification complete for record ${recordId}: ${finalStatus}`,
      );
      return { status: finalStatus };
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Verification failed for record ${recordId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private mapStatusToEvent(status: string): string {
    switch (status) {
      case 'VERIFIED':
        return 'verification_automated_success';
      case 'REJECTED':
        return 'verification_content_rejected';
      case 'INCONCLUSIVE':
        return 'verification_manual_review_required';
      default:
        return 'verification_completed';
    }
  }
}
