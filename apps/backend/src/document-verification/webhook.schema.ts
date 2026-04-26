import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const WebhookPayloadSchema = z.object({
  externalJobId: z.string().uuid().or(z.string()),
  result: z.enum(['verified', 'rejected', 'inconclusive']),
});

export class WebhookPayloadDto extends createZodDto(WebhookPayloadSchema) {}
