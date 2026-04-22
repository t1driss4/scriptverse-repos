import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { GetUser } from './decorators/get-user.decorator';
import { JwtRefreshPayload } from './types/jwt-payload.type';
import { JwtPayload } from './types/jwt-payload.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/signup
   * Register a new user and return access + refresh tokens.
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  /**
   * POST /auth/login
   * Authenticate and return access + refresh tokens.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/refresh
   * Issue a new token pair using a valid refresh token (Bearer).
   */
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@GetUser() user: JwtRefreshPayload) {
    return this.authService.refresh(user.sub, user.refreshToken);
  }

  /**
   * POST /auth/logout
   * Invalidate the current refresh token.
   */
  @UseGuards(JwtAccessGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@GetUser() user: JwtPayload) {
    return this.authService.logout(user.sub);
  }

  /**
   * POST /auth/reset-password
   * Request a password-reset email (stub – email sending not yet implemented).
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email);
  }
}
