import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../../common/decorators';
import { AuthUser } from '../auth.types';

/** Global guard: every route requires a valid Bearer access token unless marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const [type, token] = String(request.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing access token');
    }
    try {
      request.user = await this.jwt.verifyAsync<AuthUser>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return true;
  }
}
