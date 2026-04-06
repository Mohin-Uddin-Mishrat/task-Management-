import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

export const hashAuthValue = async (
  value: string,
  configService: ConfigService,
) => {
  const saltRound = Number(configService.get<string>('SALT_ROUND') ?? '10');

  return bcrypt.hash(value, saltRound);
};
