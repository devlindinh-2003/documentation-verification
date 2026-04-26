import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ConfirmUploadSchema = z.object({
  documentKey: z.string().min(1),
});

export class ConfirmUploadDto extends createZodDto(ConfirmUploadSchema) {}
