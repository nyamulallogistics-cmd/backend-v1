import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
// Avoid importing generated Prisma types until after prisma generate

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
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
        role: signupDto.role === 'transporter' ? ('TRANSPORTER' as any) : ('CARGO_OWNER' as any),
      },
    });

    // Generate JWT token
    const payload = { 
      sub: newUser.id, 
      email: newUser.email, 
      role: newUser.role 
    };
    
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
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

    // Generate JWT token
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
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
}
