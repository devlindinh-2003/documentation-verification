import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UploadUrlDto } from './dto/upload-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { DocumentVerificationService } from './document-verification.service';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { WebhookPayloadDto } from './webhook.schema';

@Controller('documents')
@Roles('seller')
export class DocumentVerificationController {
  constructor(
    private readonly verificationService: DocumentVerificationService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // Stricter rate limit for upload URL
  @Post('upload-url')
  async getUploadUrl(@Body() dto: UploadUrlDto) {
    return this.verificationService.generateUploadUrl(dto);
  }

  @Post('confirm')
  async confirmUpload(@Body() dto: ConfirmUploadDto, @Req() req: any) {
    const sellerId = req.user.id;
    return this.verificationService.confirmUploadAndStartVerification(
      dto.documentKey,
      sellerId,
    );
  }

  @Public()
  @Post('callback')
  async webhookCallback(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-webhook-signature') signature: string,
  ) {
    return this.verificationService.handleWebhookCallback(payload, signature);
  }

  @Get('my')
  async getMyVerification(@Req() req: any) {
    const sellerId = req.user.id;
    const record = await this.verificationService.getMyVerification(sellerId);
    if (!record) {
      throw new NotFoundException('Verification record not found');
    }
    return record;
  }
}
