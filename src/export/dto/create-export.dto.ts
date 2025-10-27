import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  IsEnum,
  IsObject,
  IsInt,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ExportCategoryDto {
  @ApiProperty({ description: '分类ID', example: 'category-123' })
  @IsString()
  id: string;

  @ApiProperty({ description: '分类名称', example: '餐饮' })
  @IsString()
  name: string;
}

export class ExportAccountDto {
  @ApiProperty({ description: '账户名称', example: '微信钱包' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '账户类型（前端实际字段）',
    example: 'cash',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: '账户ID（前端实际字段）',
    example: 'account-1761299847431-g4s1wovei',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: '分类ID',
    example: 'category-1',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: '余额', example: 120.5 })
  @Type(() => Number)
  @IsNumber()
  balance: number;

  @ApiProperty({ description: '图标', example: 'yh', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: '颜色', example: '#4CAF50', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: '描述',
    example: '主要微信账户',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '默认账户', example: false, required: false })
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: '不计入总资产', example: false, required: false })
  @IsOptional()
  excludeFromTotal?: boolean;

  @ApiProperty({ description: '是否信贷账户', example: false, required: false })
  @IsOptional()
  isCreditAccount?: boolean;

  @ApiProperty({
    description: '创建时间戳',
    example: 1761299847431,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  createdAt?: number;

  @ApiProperty({
    description: '更新时间戳',
    example: 1761463673091,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  updatedAt?: number;
}

export class ExportRecordDto {
  @ApiProperty({ description: '日期', example: '2025-10-26', required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    description: '时间戳',
    example: 1761451200000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  timestamp?: number;

  @ApiProperty({ description: '金额', example: 35.2 })
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: '类型',
    example: 'expense',
    enum: ['expense', 'income', 'transfer', 'reimbursement', 'refund'],
  })
  @IsEnum(['expense', 'income', 'transfer', 'reimbursement', 'refund'])
  billType: 'expense' | 'income' | 'transfer' | 'reimbursement' | 'refund';

  @ApiProperty({
    description: '分类对象',
    example: { name: '奶茶', icon: '🧋' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  category?: { name?: string; icon?: string };

  @ApiProperty({ description: '备注', example: '午餐', required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: '支付方式代码',
    example: 'wechat',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({
    description: '支付详情（前端实际字段）',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentDetail?: string;

  @ApiProperty({
    description: '支付账户（支出/转账）',
    example: {
      id: 'account-1761299847431-g4s1wovei',
      name: '测试',
      icon: 'yh',
      method: 'cash',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  paymentAccount?: {
    id?: string;
    name?: string;
    icon?: string;
    method?: string;
  };

  @ApiProperty({
    description: '收入账户信息（收入）',
    example: { id: 'account-yy', name: '储蓄卡', icon: '💳' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  incomeAccountInfo?: { id?: string; name?: string; icon?: string };

  @ApiProperty({
    description: '收入账户（字符串，前端实际字段）',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  incomeAccount?: string;

  @ApiProperty({
    description: '转账目标账户信息（内部转账）',
    example: { id: 'account-zz', name: '余额宝', icon: '💰' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  targetAccountInfo?: { id?: string; name?: string; icon?: string };

  @ApiProperty({
    description: '报销账户对象',
    example: { id: 'account-aa', name: '公司报销账户', icon: '🏢' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  reimbursementAccount?: { id?: string; name?: string; icon?: string };

  @ApiProperty({ description: '已报销金额', example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  reimbursementAmount?: number;

  @ApiProperty({
    description: '转账类型',
    example: 'internal',
    required: false,
  })
  @IsOptional()
  @IsString()
  transferType?: 'internal' | 'external';

  @ApiProperty({
    description: '转至账户名称（外部转账）',
    example: '好友张三',
    required: false,
  })
  @IsOptional()
  @IsString()
  targetAccount?: string;

  @ApiProperty({
    description: '图片列表（前端实际字段）',
    type: [String],
    example: [],
    required: false,
  })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({
    description: '记录ID（前端实际字段）',
    example: 1761463673091,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: '是否重要（前端实际字段）',
    example: false,
    required: false,
  })
  @IsOptional()
  isImportant?: boolean;

  @ApiProperty({
    description: '打印分组ID（前端实际字段）',
    example: 'grp_1761463675184_32149',
    required: false,
  })
  @IsOptional()
  @IsString()
  printGroupId?: string;
}

export class CreateExportDto {
  @ApiProperty({ description: '用户ID（用于文件名）', example: 10000000 })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n = Number(value);
    return !Number.isFinite(n) || n < 1 ? undefined : n;
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  account?: number;

  @ApiProperty({
    description: '导出文件名（可选，默认 {account}_{YYYY-MM-DD}.xlsx）',
    example: '记账数据_2025-10-26.xlsx',
    required: false,
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ description: '记录列表', type: [ExportRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExportRecordDto)
  records: ExportRecordDto[];

  @ApiProperty({ description: '账户列表', type: [ExportAccountDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExportAccountDto)
  accounts: ExportAccountDto[];

  @ApiProperty({
    description: '分类映射（可选）',
    type: [ExportCategoryDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExportCategoryDto)
  categories?: ExportCategoryDto[];
}
