import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../../common/decorators';
import { AuthUser } from '../auth.types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

function contextWith(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function reflectorReturning(metadata: Record<string, unknown>): Reflector {
  return {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
}

const admin: AuthUser = {
  sub: 'u1',
  email: 'admin@demo.com',
  name: 'Admin',
  role: Role.ADMIN,
  businessId: 'b1',
  staffId: null,
};
const staff: AuthUser = { ...admin, sub: 'u2', role: Role.STAFF, staffId: 's1' };

describe('RolesGuard', () => {
  it('allows any authenticated user when no roles are required', () => {
    const guard = new RolesGuard(reflectorReturning({}));
    expect(guard.canActivate(contextWith({ user: staff }))).toBe(true);
  });

  it('allows a user whose role is in the required list', () => {
    const guard = new RolesGuard(reflectorReturning({ [ROLES_KEY]: [Role.ADMIN] }));
    expect(guard.canActivate(contextWith({ user: admin }))).toBe(true);
  });

  it('rejects a STAFF user on an ADMIN-only route', () => {
    const guard = new RolesGuard(reflectorReturning({ [ROLES_KEY]: [Role.ADMIN] }));
    expect(() => guard.canActivate(contextWith({ user: staff }))).toThrow(ForbiddenException);
  });

  it('allows routes open to both roles', () => {
    const guard = new RolesGuard(reflectorReturning({ [ROLES_KEY]: [Role.ADMIN, Role.STAFF] }));
    expect(guard.canActivate(contextWith({ user: staff }))).toBe(true);
  });

  it('rejects when there is no user on the request', () => {
    const guard = new RolesGuard(reflectorReturning({ [ROLES_KEY]: [Role.STAFF] }));
    expect(() => guard.canActivate(contextWith({}))).toThrow(ForbiddenException);
  });
});

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: 'test-secret' });

  it('lets public routes through without a token', async () => {
    const guard = new JwtAuthGuard(jwt, reflectorReturning({ [IS_PUBLIC_KEY]: true }));
    await expect(guard.canActivate(contextWith({ headers: {} }))).resolves.toBe(true);
  });

  it('rejects requests without a bearer token', async () => {
    const guard = new JwtAuthGuard(jwt, reflectorReturning({}));
    await expect(guard.canActivate(contextWith({ headers: {} }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects malformed or forged tokens', async () => {
    const guard = new JwtAuthGuard(jwt, reflectorReturning({}));
    const forged = await new JwtService({ secret: 'other-secret' }).signAsync({ ...admin });
    await expect(
      guard.canActivate(contextWith({ headers: { authorization: `Bearer ${forged}` } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects expired tokens', async () => {
    const guard = new JwtAuthGuard(jwt, reflectorReturning({}));
    const expired = await jwt.signAsync({ ...admin }, { expiresIn: -10 });
    await expect(
      guard.canActivate(contextWith({ headers: { authorization: `Bearer ${expired}` } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the decoded user for a valid token', async () => {
    const guard = new JwtAuthGuard(jwt, reflectorReturning({}));
    const token = await jwt.signAsync({ ...admin });
    const request: Record<string, unknown> = { headers: { authorization: `Bearer ${token}` } };
    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(request.user).toMatchObject({ sub: 'u1', role: Role.ADMIN });
  });
});
