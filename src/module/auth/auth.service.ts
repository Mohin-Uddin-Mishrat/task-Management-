import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { hashAuthValue } from './utils/auth-password.util';
import {
  generateAuthTokens,
  verifyRefreshJwtToken,
} from './utils/auth-token.util';
import { sanitizeAuthUser } from './utils/auth-user.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists with this email');
    }

    const hashedPassword = await hashAuthValue(dto.password, this.configService);

    const user = await this.prisma.client.user.create({
      data: {
        email,
        name: dto.name,
        password: hashedPassword,
        role: Role.USER,
      },
    });

    const tokens = await generateAuthTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }, this.jwtService, this.configService);

    return {
      user: sanitizeAuthUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordMatched = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await generateAuthTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }, this.jwtService, this.configService);

    return {
      user: sanitizeAuthUser(user),
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = await verifyRefreshJwtToken(
      token,
      this.jwtService,
      this.configService,
    );

    const user = await this.prisma.client.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await generateAuthTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }, this.jwtService, this.configService);

    return {
      user: sanitizeAuthUser(user),
      ...tokens,
    };
  }

  async logout(_userId: string) {
    return {
      success: true,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return sanitizeAuthUser(user);
  }
}
