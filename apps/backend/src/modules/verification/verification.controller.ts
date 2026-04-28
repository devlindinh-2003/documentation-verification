import { Controller, Post, Get, Body, Req, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UploadUrlDto } from './dto/upload-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { VerificationService } from './verification.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('documents')
@Roles('seller')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post('upload-url')
  async getUploadUrl(@Body() dto: UploadUrlDto) {
    return this.verificationService.generateUploadUrl(dto);
  }

  @Post('confirm')
  async confirmUpload(@Body() dto: ConfirmUploadDto, @Req() req: any) {
    const sellerId = req.user.id;
    return this.verificationService.confirmUploadAndStartVerification(dto.documentKey, sellerId);
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

  @Get()
  async getAllVerifications(@Req() req: any) {
    const sellerId = req.user.id;
    return this.verificationService.getAllVerifications(sellerId);
  }
}
