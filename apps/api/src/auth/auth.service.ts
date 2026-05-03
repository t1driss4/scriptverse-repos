import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.type';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET is not set');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is not set');
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
  }

  // ─── Signup ──────────────────────────────────────────────────────────────────

  async signup(dto: SignupDto) {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role ?? Role.APPRENANT,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw e;
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.storeRefreshHash(user.id, tokens.refreshToken);
    return tokens;
  }

  // ─── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.storeRefreshHash(user.id, tokens.refreshToken);
    return tokens;
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshHash)
      throw new ForbiddenException('Access denied');

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshHash);
    if (!tokenMatch) throw new ForbiddenException('Access denied');

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.storeRefreshHash(user.id, tokens.refreshToken);
    return tokens;
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshHash: null },
    });
  }

  // ─── Me ──────────────────────────────────────────────────────────────────────

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { passwordHash, refreshHash, ...profile } = user;
    return profile;
  }

  // ─── Reset password (stub) ───────────────────────────────────────────────────

  async resetPassword(email: string) {
    // TODO: generate a one-time token, store it, and send it via email
    // For now we simply acknowledge the request without leaking existence.
    return {
      message:
        'If that email is registered you will receive a reset link shortly.',
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async issueTokens(userId: string, email: string, role: Role) {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshHash: hash },
    });
  }
}
