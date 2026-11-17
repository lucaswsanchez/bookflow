import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './auth.types';
import { TokensDto } from './dto/auth.dto';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
// Used when the email doesn't exist so response time doesn't reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

/**
 * Access tokens are short-lived JWTs. Refresh tokens are opaque random strings
 * ("<id>.<secret>") stored hashed in the database and rotated on every use,
 * so they can be revoked (logout) and a stolen token is only usable once.
 */
@Injectable()
export class AuthService {
  private readonly accessTtl = Number(process.env.JWT_ACCESS_TTL ?? 900);
  private readonly refreshTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<TokensDto> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedException('Invalid email or password');
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokensDto> {
    const [id, secret] = refreshToken.split('.');
    if (!id || !secret) throw new UnauthorizedException('Invalid refresh token');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id },
      include: { user: true },
    });
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.tokenHash !== sha256(secret)
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string): Promise<void> {
    const [id] = refreshToken.split('.');
    if (!id) return;
    await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { business: true, staff: true },
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      staffId: user.staffId,
      business: {
        id: user.business.id,
        name: user.business.name,
        slug: user.business.slug,
        timezone: user.business.timezone,
      },
    };
  }

  private async issueTokens(user: User): Promise<TokensDto> {
    const payload: AuthUser = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      staffId: user.staffId,
    };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: this.accessTtl });

    const secret = randomBytes(32).toString('base64url');
    const stored = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(secret),
        expiresAt: new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: `${stored.id}.${secret}`,
      expiresIn: this.accessTtl,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        staffId: user.staffId,
      },
    };
  }
}
