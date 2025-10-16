/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
// Avoid importing generated Prisma types until after prisma generate

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email: signupDto.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        fullName: signupDto.fullName,
        email: signupDto.email,
        password: hashedPassword,
        companyName: signupDto.companyName,
        phoneNumber: signupDto.phoneNumber,
        // Use raw enum string values; Prisma will coerce correctly after generate
        role: signupDto.role === 'transporter' 
          ? ('TRANSPORTER' as any) 
          : signupDto.role === 'admin'
            ? ('ADMIN' as any)
            : ('CARGO_OWNER' as any),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(newUser.id, newUser.email, newUser.role);

    return {
      ...tokens,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        companyName: newUser.companyName,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({ where: { email: loginDto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string): Promise<any | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user;
  }

  async getUserByEmail(email: string): Promise<any | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user;
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(userId: string, email: string, role: any) {
    const payload = { sub: userId, email, role };

    // Generate access token (short-lived)
    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
    });

    // Generate refresh token (long-lived)
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    });

    // Store refresh token in database with expiration
    const expiresAt = new Date();
    const expirationDays = this.parseExpiration(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d'
    );
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Hash the refresh token before storing
    const hashedToken = crypto.createHash('sha256').update(refresh_token).digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt,
      },
    });

    return { access_token, refresh_token };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate refresh token
    const isValid = await this.validateRefreshToken(userId, refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old refresh token (token rotation)
    await this.revokeRefreshToken(refreshToken);

    // Generate new tokens
    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Validate refresh token exists and is not expired/revoked
   */
  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const token = await this.prisma.refreshToken.findFirst({
      where: {
        token: hashedToken,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return !!token;
  }

  /**
   * Revoke a refresh token (logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.revokeRefreshToken(refreshToken);
  }

  /**
   * Parse expiration string (e.g., '7d', '15m') to days
   */
  private parseExpiration(expiration: string): number {
    const value = parseInt(expiration);
    const unit = expiration.slice(-1);

    switch (unit) {
      case 'd':
        return value;
      case 'h':
        return value / 24;
      case 'm':
        return value / (24 * 60);
      default:
        return 7; // default to 7 days
    }
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });
  }
}
