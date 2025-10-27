import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ValidationPipe,
  UsePipes,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { ExportService } from './export.service';
import { CreateExportDto } from './dto/create-export.dto';
import { Request, Response } from 'express';
import { ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('excel')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
    }),
  )
  async exportExcel(@Body() dto: CreateExportDto, @Req() req: Request) {
    // 1) 优先使用 body.account；2) 无效则从 token 兜底
    let account = Number(dto?.account);
    if (!Number.isInteger(account) || account <= 0) {
      const auth = req.headers['authorization'];
      if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
        try {
          const token = auth.slice(7);
          const payloadStr = Buffer.from(
            token.split('.')[1],
            'base64',
          ).toString('utf8');
          const payload = JSON.parse(payloadStr);
          const acc = Number(payload?.account);
          if (Number.isInteger(acc) && acc > 0) {
            account = acc;
          }
        } catch {
          // ignore
        }
      }
    }
    if (!Number.isInteger(account) || account <= 0) {
      throw new BadRequestException('account 必须为正整数');
    }

    const dtoWithAcc: CreateExportDto = { ...dto, account };
    const { filename } = await this.exportService.generateExcel(dtoWithAcc);
    const base =
      process.env.PUBLIC_BASE_URL ?? `${req.protocol}://${req.get('host')}`;
    const url = `${base}/export/file/${encodeURIComponent(filename)}`;
    return { url, filename };
  }

  @Get('file/:filename')
  @ApiOperation({ summary: '下载生成的 Excel 文件' })
  @ApiParam({
    name: 'filename',
    description: 'Excel 文件名',
    example: '10000000_2025-10-26.xlsx',
  })
  @ApiOkResponse({ description: '返回 Excel 文件（二进制流）' })
  async downloadExcel(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const safe = decodeURIComponent(filename).replace(/[/\\?%*:|"<>]/g, '_');
    const full = this.exportService.getExportFilePath(safe);
    if (!full) {
      throw new NotFoundException('文件不存在');
    }
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(safe)}"`,
    );
    res.sendFile(full);
  }

  @Delete('file/by-account/:account')
  @ApiOperation({ summary: '根据用户账号删除导出的 Excel 文件（全部匹配）' })
  @ApiParam({ name: 'account', description: '用户账号', example: 10000000 })
  async deleteByAccount(@Param('account') accountParam: string) {
    const account = Number(accountParam);
    if (!Number.isInteger(account) || account <= 0) {
      throw new BadRequestException('account 必须为正整数');
    }
    const result = await this.exportService.deleteByAccount(account);
    return { deleted: result.deleted, count: result.deleted.length };
  }
}
