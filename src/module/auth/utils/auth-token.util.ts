import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../strategy/jwt.strategy';

export const generateAuthTokens = async (
  payload: JwtPayload,
  jwtService: JwtService,
  configService: ConfigService,
) => {
  const accessToken = await jwtService.signAsync(payload, {
    secret: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
    expiresIn: configService.getOrThrow<string>(
      'ACCESS_TOKEN_EXPIREIN',
    ) as never,
  });

  const refreshToken = await jwtService.signAsync(payload, {
    secret: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    expiresIn: configService.getOrThrow<string>(
      'REFRESH_TOKEN_EXPIREIN',
    ) as never,
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const verifyRefreshJwtToken = async (
  token: string,
  jwtService: JwtService,
  configService: ConfigService,
) => {
  try {
    return await jwtService.verifyAsync<JwtPayload>(token, {
      secret: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    });
  } catch {
    throw new UnauthorizedException('Invalid refresh token');
  }
};
