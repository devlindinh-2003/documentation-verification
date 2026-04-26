import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string(),
});

export class LoginDto extends createZodDto(LoginSchema) {}
