import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateExportDto } from './dto/create-export.dto';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportService {
  // 导出目录（优先环境变量，其次项目根 exportFiles）
  getExportDir(): string {
    const configured = process.env.EXPORT_DIR;
    let dir: string;
    if (configured && configured.trim()) {
      dir = configured;
    } else {
      // 当从 dist 运行时，__dirname 指向 dist 内部，回退到项目根目录的 exportFiles
      const projectRoot = path.resolve(__dirname, '../../..');
      dir = path.join(projectRoot, 'exportFiles');
    }
    fs.mkdirSync(dir, { recursive: true });
    console.log('[ExportService] export dir:', dir, 'configured:', configured);
    return dir;
  }

  // 根据文件名返回绝对路径（存在才返回）
  getExportFilePath(filename: string): string | null {
    const full = path.join(this.getExportDir(), filename);
    return fs.existsSync(full) ? full : null;
  }

  // 生成 Excel 文件（文件名：{account}_{YYYY-MM-DD}.xlsx）
  async generateExcel(
    dto: CreateExportDto,
  ): Promise<{ filename: string; path: string }> {
    if (
      !dto ||
      typeof dto.account !== 'number' ||
      !Number.isInteger(dto.account) ||
      dto.account <= 0
    ) {
      throw new BadRequestException('account 必须为正整数');
    }

    const records = Array.isArray(dto?.records) ? dto.records : [];
    const accounts = Array.isArray(dto?.accounts) ? dto.accounts : [];
    const categories = Array.isArray(dto?.categories) ? dto.categories : [];

    const getCategoryName = (categoryId: string | undefined) => {
      if (!categoryId) return '未分类';
      const found = categories.find((c) => String(c.id) === String(categoryId));
      return found?.name ?? '未分类';
    };

    const getRecordTypeText = (record: any) => {
      switch (record?.billType) {
        case 'expense':
          return '支出';
        case 'income':
          return '收入';
        case 'transfer':
          return record?.transferType === 'internal' ? '账户内转账' : '转出';
        case 'reimbursement':
          return '报销';
        case 'refund':
          return '退款';
        default:
          return '其他';
      }
    };

    const getOutAccountName = (record: any) => {
      // 支出/转账/报销的支付/转出账户
      if (!record || record.billType === 'income') return '';
      return record?.paymentAccount?.name || record?.paymentMethod || '';
    };
    const getInAccountName = (record: any) =>
      record?.incomeAccountInfo?.name || '';
    const getTransferTargetAccountName = (record: any) => {
      if (record?.billType !== 'transfer') return '';
      if (record?.transferType === 'internal') {
        return record?.targetAccountInfo?.name || record?.targetAccount || '';
      }
      return record?.targetAccount || '';
    };
    const getReimbursementAccountName = (record: any) =>
      record?.reimbursementAccount?.name || '';

    // 工作簿
    const wb = XLSX.utils.book_new();

    // Sheet 1：记账数据
    const recordHeaders = [
      '日期',
      '金额',
      '类型',
      '分类',
      '支付账户',
      '备注',
      '转出账户',
      '存放账户',
      '转至账户',
      '报销账户',
      '已报销金额',
      '转账类型',
    ];
    const recordDataRows = records.map((record) => {
      const dateText =
        record?.date ||
        (record?.timestamp
          ? new Date(record.timestamp).toISOString().split('T')[0]
          : '');
      const amountNum =
        typeof record?.amount === 'number'
          ? record.amount
          : Number(record?.amount || 0);
      const typeText = getRecordTypeText(record);
      const payAccount = getOutAccountName(record) || '';
      const storeAccount = getInAccountName(record) || '';
      const targetAccount = getTransferTargetAccountName(record) || '';
      const reimbursementAccount = getReimbursementAccountName(record) || '';
      const reimbursedAmount =
        typeof record?.reimbursementAmount === 'number'
          ? record.reimbursementAmount
          : '';
      const transferTypeText =
        record?.billType === 'transfer'
          ? record?.transferType === 'internal'
            ? '账户内转账'
            : '转出'
          : '';

      return [
        dateText,
        amountNum,
        typeText,
        record?.category?.name || '未分类',
        record?.billType === 'income' ? storeAccount : payAccount,
        record?.note || '',
        payAccount,
        storeAccount,
        targetAccount,
        reimbursementAccount,
        reimbursedAmount,
        transferTypeText,
      ];
    });
    const recordAoa = [recordHeaders, ...recordDataRows];
    if (recordAoa.length === 1) {
      recordAoa.push(['导出校验', '没有可导出的记录数据（仅表头）']);
    }
    const recordWs = XLSX.utils.aoa_to_sheet(recordAoa);
    XLSX.utils.book_append_sheet(wb, recordWs, '记账数据');

    // Sheet 2：账户数据
    const accountHeaders = [
      '账户名称',
      '分类',
      '余额',
      '图标',
      '颜色',
      '描述',
      '是否默认',
      '不计入总资产',
      '是否信贷账户',
      '创建时间',
      '更新时间',
    ];
    const accountDataRows = accounts.map((account) => {
      const createdTime = account?.createdAt
        ? new Date(account.createdAt).toLocaleString()
        : '';
      const updatedTime = account?.updatedAt
        ? new Date(account.updatedAt).toLocaleString()
        : '';
      return [
        account?.name || '',
        getCategoryName(account?.categoryId),
        typeof account?.balance === 'number' ? account.balance : 0,
        account?.icon || '',
        account?.color || '',
        account?.description || '',
        account?.isDefault ? '是' : '否',
        account?.excludeFromTotal ? '是' : '否',
        account?.isCreditAccount ? '是' : '否',
        createdTime,
        updatedTime,
      ];
    });
    const accountAoa = [accountHeaders, ...accountDataRows];
    if (accountAoa.length === 1) {
      accountAoa.push(['导出校验', '没有可导出的账户数据（仅表头）']);
    }
    const accountWs = XLSX.utils.aoa_to_sheet(accountAoa);
    XLSX.utils.book_append_sheet(wb, accountWs, '账户数据');

    // 生成文件名与路径（强制 {account}_{YYYY-MM-DD}.xlsx）
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const safeAccount = String(dto.account).replace(/[/\\?%*:|"<>]/g, '_');
    const filename = `${safeAccount}_${dateStr}.xlsx`;

    const dir = this.getExportDir();
    const filePath = path.join(dir, filename);

    console.log('[ExportService] writing Excel:', filePath);

    try {
      XLSX.writeFile(wb, filePath);
      const exists = fs.existsSync(filePath);
      console.log('[ExportService] wrote ok? exists =', exists);
    } catch (e) {
      console.error('[ExportService] write failed:', e);
      throw e;
    }

    return { filename, path: filePath };
  }

  async deleteByAccount(account: number): Promise<{ deleted: string[] }> {
    const dir = this.getExportDir();
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    const pattern = new RegExp(`^${account}_\\d{4}-\\d{2}-\\d{2}\\.xlsx$`);
    const targetFiles = files.filter((f) => pattern.test(f));
    const deleted: string[] = [];
    for (const f of targetFiles) {
      const fp = path.join(dir, f);
      try {
        fs.unlinkSync(fp);
        deleted.push(f);
      } catch (e) {
        console.error('[ExportService] delete failed:', fp, e);
      }
    }
    return { deleted };
  }
}
