import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UploadUrlSchema = z.object({
  fileName: z.string(),
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
});

export class UploadUrlDto extends createZodDto(UploadUrlSchema) {}
