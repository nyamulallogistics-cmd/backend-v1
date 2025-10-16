import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body?.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Validate the refresh token exists in database
    const isValid = await this.authService.validateRefreshToken(payload.sub, refreshToken);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { 
      id: payload.sub,
      userId: payload.sub,
      email: payload.email, 
      role: payload.role,
      refreshToken,
    };
  }
}

