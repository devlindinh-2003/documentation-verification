import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DecisionDto } from './dto/decision.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/verifications')
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.listVerifications(
      status,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.adminService.getVerificationById(id);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.adminService.getHistory(id);
  }

  @Get(':id/document')
  async getDocumentUrl(@Param('id') id: string) {
    return this.adminService.getDocumentUrl(id);
  }

  @Post(':id/claim')
  async claim(@Param('id') id: string, @Req() req: any) {
    return this.adminService.claimRecord(id, req.user.id);
  }

  @Post(':id/decision')
  async makeDecision(
    @Param('id') id: string,
    @Body() dto: DecisionDto,
    @Req() req: any,
  ) {
    return this.adminService.submitDecision(id, req.user.id, dto);
  }
}
