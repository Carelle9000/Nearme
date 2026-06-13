import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(JwtGuard)
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  // POST /sync/push
  @Post('push')
  @HttpCode(200)
  push(@Req() req: any, @Body() body: any) {
    return this.sync.push(req.userId, body);
  }

  // GET /sync/pull?last_sync=<ISO>
  @Get('pull')
  pull(@Req() req: any, @Query('last_sync') lastSyncStr?: string) {
    const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;
    return this.sync.pull(req.userId, lastSync);
  }
}
