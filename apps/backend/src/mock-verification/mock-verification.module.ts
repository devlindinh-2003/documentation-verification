import { Module } from '@nestjs/common';
import { MockVerificationService } from './mock-verification.service';

@Module({
  controllers: [],
  providers: [MockVerificationService],
  exports: [MockVerificationService],
})
export class MockVerificationModule {}
