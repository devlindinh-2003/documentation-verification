import { Injectable, Logger } from '@nestjs/common';

export type VerificationResult = 'VERIFIED' | 'REJECTED' | 'INCONCLUSIVE';

export interface VerificationResponse {
  status: VerificationResult;
  confidence: number;
  message: string;
}

@Injectable()
export class MockVerificationService {
  private readonly logger = new Logger(MockVerificationService.name);

  async verifyDocument(documentKey: string): Promise<VerificationResponse> {
    this.logger.log(`Starting mock verification for document: ${documentKey}`);

    // Simulate network delay (1-3 seconds)
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Simulate random failure (5% chance)
    if (Math.random() < 0.05) {
      this.logger.error('External Service Timeout (Simulated)');
      throw new Error('External Service Timeout');
    }

    const random = Math.random();
    let status: VerificationResult;
    let confidence: number;
    let message: string;

    if (documentKey.toLowerCase().endsWith('verified.pdf')) {
      status = 'VERIFIED';
      confidence = 0.99;
      message = 'Document verified via deterministic test (verified.pdf).';
    } else if (documentKey.toLowerCase().endsWith('rejected.pdf')) {
      status = 'REJECTED';
      confidence = 0.99;
      message = 'Document rejected via deterministic test (rejected.pdf).';
    } else if (documentKey.toLowerCase().endsWith('inconclusive.pdf')) {
      status = 'INCONCLUSIVE';
      confidence = 0.5;
      message =
        'Document marked for review via deterministic test (inconclusive.pdf).';
    } else if (random < 0.5) {
      status = 'VERIFIED';
      confidence = 0.8 + Math.random() * 0.15;
      message = 'Document integrity and data verified successfully.';
    } else if (random < 0.8) {
      status = 'INCONCLUSIVE';
      confidence = 0.5 + Math.random() * 0.3;
      message = 'Low OCR confidence, manual review required.';
    } else {
      status = 'REJECTED';
      confidence = 0.3 + Math.random() * 0.2;
      message = 'Document detected as invalid or tampered.';
    }

    this.logger.log(
      `Mock verification complete: ${status} (${confidence.toFixed(2)})`,
    );

    return {
      status,
      confidence,
      message,
    };
  }
}
