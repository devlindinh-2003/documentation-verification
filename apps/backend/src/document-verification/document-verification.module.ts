import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DocumentVerificationController } from './document-verification.controller';
import { DocumentVerificationService } from './document-verification.service';
import { StateMachineService } from './state-machine.service';
import { VerificationWorker } from './verification.worker';

import { MockVerificationModule } from '../mock-verification/mock-verification.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    BullModule.registerQueue({
      name: 'verification-jobs',
    }),
    MockVerificationModule,
  ],
  controllers: [DocumentVerificationController],
  providers: [
    DocumentVerificationService,
    StateMachineService,
    VerificationWorker,
  ],
  exports: [StateMachineService],
})
export class DocumentVerificationModule {}
