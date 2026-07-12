import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import type { RequestWithUser } from './interfaces/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Get('check-username')
  async checkUsername(@Query('username') username: string) {
    return this.authService.checkUsername(username);
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('guest')
  async guestLogin() {
    return this.authService.createGuestUser();
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('contact')
  async submitContact(
    @Body() dto: { name: string; email: string; company?: string; type: string; message: string },
  ) {
    return this.authService.createContactInquiry(dto);
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('feedback')
  async submitFeedback(
    @Body() dto: {
      userId?: string; userEmail?: string; isGuest?: boolean;
      type: string; message: string; pageUrl: string;
      pageTitle?: string; component?: string;
      errorMessage?: string; errorStack?: string;
      browserInfo?: string; screenSize?: string; metadata?: any;
    },
  ) {
    return this.authService.createUserFeedback(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Get('me')
  async getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  @Get('users')
  async getUsers(@Request() req: RequestWithUser) {
    return this.authService.findAllTenantUsers(req.user.tenantId);
  }
}
