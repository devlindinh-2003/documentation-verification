import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DRIZZLE } from '../../database/db.module';
import { users } from '../../database/schema';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new user with a hashed password.
   */
  async register(registerDto: RegisterDto) {
    if (registerDto.role === 'admin') {
      throw new ConflictException('Admin registration is not allowed');
    }

    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, registerDto.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await argon2.hash(registerDto.password);

    try {
      const [newUser] = await this.db
        .insert(users)
        .values({
          email: registerDto.email,
          passwordHash: hashedPassword,
          role: registerDto.role,
          isDemo: false,
        })
        .returning();

      if (!newUser) {
        throw new InternalServerErrorException('Failed to create user record');
      }

      return this.generateToken(newUser);
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Creates a volatile demo account for quick evaluation.
   */
  async createDemoAccount() {
    // Generate a unique email to avoid collision in high-concurrency scenarios
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const email = `demo_${timestamp}_${randomStr}@example.com`;
    const password = 'password123';

    try {
      const hashedPassword = await argon2.hash(password);
      const [newUser] = await this.db
        .insert(users)
        .values({
          email,
          passwordHash: hashedPassword,
          role: 'seller',
          isDemo: true,
        })
        .returning();

      if (!newUser) {
        this.logger.error('Database insert returned empty result for demo account');
        throw new InternalServerErrorException('Failed to generate demo account');
      }

      return {
        email: newUser.email,
        password: password,
      };
    } catch (error) {
      this.logger.error(`Demo account creation failed: ${error.message}`, error.stack);

      if (error.message.includes('bindings') || error.message.includes('native')) {
        throw new InternalServerErrorException('Cryptographic module error - check environment');
      }

      throw new InternalServerErrorException(
        'Internal server error during demo account generation',
      );
    }
  }

  /**
   * Validates user credentials and returns a JWT access token.
   */
  async login(loginDto: LoginDto) {
    const userResult = await this.db
      .select()
      .from(users)
      .where(eq(users.email, loginDto.email))
      .limit(1);

    if (userResult.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = userResult[0];
    const isPasswordValid = await argon2.verify(user.passwordHash, loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  /**
   * Generates a JWT containing basic user identity and role.
   */
  private generateToken(user: typeof users.$inferSelect) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
