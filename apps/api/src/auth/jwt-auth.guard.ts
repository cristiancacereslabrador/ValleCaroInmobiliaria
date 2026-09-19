import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export const BROKER_SESSION_COOKIE = 'broker_session';

export interface BrokerJwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: BrokerJwtPayload }>();
    const token = request.cookies?.[BROKER_SESSION_COOKIE];
    request.user = this.verify(token);
    if (!request.user) {
      throw new UnauthorizedException('Sesión requerida');
    }
    return true;
  }

  protected verify(token: unknown): BrokerJwtPayload | undefined {
    if (!token || typeof token !== 'string') {
      return undefined;
    }
    try {
      const secret = this.configService.get<string>('JWT_SECRET', 'dev-only-change-me');
      return jwt.verify(token, secret) as BrokerJwtPayload;
    } catch {
      return undefined;
    }
  }
}

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: BrokerJwtPayload }>();
    const token = request.cookies?.[BROKER_SESSION_COOKIE];
    request.user = this.verify(token);
    return true;
  }
}
