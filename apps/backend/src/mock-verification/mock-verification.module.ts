import { Module } from '@nestjs/common';
import { MockVerificationController } from './mock-verification.controller';

@Module({
  controllers: [MockVerificationController],
})
export class MockVerificationModule {}
