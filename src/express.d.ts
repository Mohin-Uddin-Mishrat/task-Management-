import { JwtPayload } from 'src/module/auth/strategy/jwt.strategy';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
