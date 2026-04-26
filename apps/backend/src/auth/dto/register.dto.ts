import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(6),
  role: z.enum(['seller', 'admin']),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
