import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { BrokerJwtPayload } from './jwt-auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): BrokerJwtPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: BrokerJwtPayload }>();
    return request.user;
  },
);
