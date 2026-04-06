import { Request, Response } from 'express';

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const secure = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 3650,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};

export const getCookieValue = (req: Request, cookieName: string) => {
  const rawCookie = req.headers.cookie;

  if (!rawCookie) {
    return '';
  }

  const cookie = rawCookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
};
