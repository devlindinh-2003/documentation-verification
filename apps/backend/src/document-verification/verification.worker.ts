import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { StateMachineService } from './state-machine.service';

@Processor('verification-jobs')
@Injectable()
export class VerificationWorker extends WorkerHost {
  private readonly logger = new Logger(VerificationWorker.name);

  constructor(private readonly stateMachine: StateMachineService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing verification job ${job?.id} for record ${job?.data?.recordId}`,
    );

    const { recordId, documentKey, version, externalJobId } = job?.data || {};

    let currentVersion = version;

    try {
      // 1. Transition pending -> processing
      const updatedRecord = await this.stateMachine.transition(
        recordId,
        currentVersion,
        'processing',
        'system',
        'system',
        'job_dispatched',
        { externalJobId },
        { externalJobId },
      );
      currentVersion = updatedRecord.version;
    } catch (error: any) {
      if (error?.status === 409 || error?.status === 422) {
        this.logger.warn(
          `Skipping job ${job?.id}: state transition failed (${error?.message})`,
        );
        return;
      }
      throw error;
    }

    // 2. Call external mock service
    try {
      const response = await fetch(
        process.env.MOCK_VENDOR_URL || 'http://localhost:8000/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            externalJobId,
            documentKey,
            callbackUrl:
              process.env.CALLBACK_URL ||
              'http://localhost:8000/documents/callback',
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Vendor API error: ${response.statusText}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to dispatch to vendor: ${error?.message}`);

      const maxAttempts = job?.opts?.attempts || 1;
      const currentAttempt = (job?.attemptsMade || 0) + 1;

      if (currentAttempt >= maxAttempts) {
        await this.stateMachine.transition(
          recordId,
          currentVersion,
          'rejected',
          'system',
          'system',
          'vendor_api_failure',
          { error: error?.message },
        );
      } else {
        const updatedRecord = await this.stateMachine.transition(
          recordId,
          currentVersion,
          'pending',
          'system',
          'system',
          'vendor_api_retry',
          { error: error?.message, attempt: currentAttempt },
        );

        await job?.updateData({
          ...job?.data,
          version: updatedRecord?.version,
        });
      }

      throw error;
    }
  }
}
