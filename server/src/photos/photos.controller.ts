import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  Body,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtGuard } from '../auth/jwt.guard';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { lookup as mimeLookup } from 'mime-types';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

@Controller('photos')
export class PhotosController {
  // POST /photos/upload  { data: "<base64>", ext: "jpg" }
  @Post('upload')
  @UseGuards(JwtGuard)
  async upload(@Req() req: any, @Body() body: { data: string; ext: string }) {
    if (!body.data || !body.ext) {
      throw new HttpException('data and ext required', HttpStatus.BAD_REQUEST);
    }

    const userId: string = req.userId;
    const dir = path.join(UPLOADS_DIR, userId);
    fs.mkdirSync(dir, { recursive: true });

    const filename = `${uuidv4()}.${body.ext.replace(/[^a-zA-Z0-9]/g, '')}`;
    const filepath = path.join(dir, filename);

    const buffer = Buffer.from(body.data, 'base64');
    fs.writeFileSync(filepath, buffer);

    return { path: `/photos/${userId}/${filename}` };
  }

  // GET /photos/:userId/:filename
  @Get(':userId/:filename')
  servePhoto(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Path traversal guard
    if (
      userId.includes('/') ||
      userId.includes('..') ||
      filename.includes('/') ||
      filename.includes('..')
    ) {
      throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    }

    const filepath = path.join(UPLOADS_DIR, userId, filename);
    if (!fs.existsSync(filepath)) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    const mime = mimeLookup(filename) || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(filepath);
  }
}
