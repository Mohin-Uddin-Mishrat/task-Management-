import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtPayload = {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
};

const extractTokenFromCookie = (cookieName: string) => {
  return (request: { headers?: { cookie?: string } }) => {
    const rawCookie = request?.headers?.cookie;
    if (!rawCookie) {
      return null;
    }

    const cookie = rawCookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${cookieName}=`));

    if (!cookie) {
      return null;
    }

    return decodeURIComponent(cookie.split('=').slice(1).join('='));
  };
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractTokenFromCookie('accessToken'),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
