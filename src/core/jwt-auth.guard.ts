import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers['authorization'];
    if (!auth) {
      throw new UnauthorizedException('缺少 Authorization 头');
    }
    const [type, token] = auth.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('无效的 Authorization 头');
    }
    try {
      const payload = this.jwtService.verify(token, {
        secret: 'never-expire-token-secret',
      });
      (req as any).user = payload; // { sub: user.id, account: user.account, ... }
      return true;
    } catch {
      throw new UnauthorizedException('无效或过期的 token');
    }
  }
}
