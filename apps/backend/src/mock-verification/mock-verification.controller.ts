import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { setTimeout } from 'timers/promises';

@Controller('verify')
export class MockVerificationController {
  @Public()
  @Post()
  async verify(
    @Body()
    body: {
      externalJobId: string;
      documentKey: string;
      callbackUrl: string;
    },
  ) {
    (async () => {
      const delay = Math.floor(Math.random() * 4500) + 500;
      await setTimeout(delay);

      const results = ['verified', 'rejected', 'inconclusive'];
      const randomResult = results[Math.floor(Math.random() * results.length)];

      try {
        await fetch(body.callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-signature': 'valid-signature-for-mock',
          },
          body: JSON.stringify({
            externalJobId: body.externalJobId,
            result: randomResult,
          }),
        });
      } catch (err) {
        console.error('Mock verification callback failed', err);
      }
    })();

    return { status: 'accepted' };
  }
}
