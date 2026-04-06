import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorators';
import sendResponse from '../utils/sendResponse';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  clearAuthCookies,
  getCookieValue,
  setAuthCookies,
} from './utils/auth-cookie.util';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.register(dto);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(dto);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User logged in successfully',
      data: result,
    });
  }

  @Post('refresh-token')
  @Public()
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const refreshToken = getCookieValue(req, 'refreshToken');
    const result = await this.authService.refreshToken(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const result = await this.authService.logout(req.user.id);
    clearAuthCookies(res);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User logged out successfully',
      data: result,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get logged in user info' })
  async getMe(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const result = await this.authService.getMe(req.user.id);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: result,
    });
  }
}
