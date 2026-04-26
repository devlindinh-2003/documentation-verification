import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DecisionSchema = z.object({
  decision: z.enum(['approved', 'denied']),
  version: z.number().int(),
  reason: z.string().optional(),
});

export class DecisionDto extends createZodDto(DecisionSchema) {}
