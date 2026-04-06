import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const email = this.configService.get<string>('email')?.trim().toLowerCase();
    const name = this.configService.get<string>('name')?.trim() ?? 'admin';
    const password = this.configService.get<string>('password');
    const envRole = this.configService.get<string>('role')?.trim().toUpperCase();
    const role = envRole === Role.ADMIN ? Role.ADMIN : Role.USER;

    if (!email || !password) {
      this.logger.warn('Admin seeder skipped because env credentials are missing');
      return;
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(this.configService.get<string>('SALT_ROUND') ?? '10'),
    );

    await this.prisma.client.user.upsert({
      where: { email },
      update: {
        name,
        password: hashedPassword,
        role,
      },
      create: {
        email,
        name,
        password: hashedPassword,
        role,
      },
    });

    this.logger.log(`Admin seeder ensured account exists for ${email}`);
  }
}
