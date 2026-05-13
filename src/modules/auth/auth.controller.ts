import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@auth/auth.service';
import { UsersService } from '@user/users.service';
import { type Response, type Request } from 'express';
import { AuthCredentialsDto } from '@auth/dto/inputs/auth-credentials.input';
import { JWT_TOKEN_SETTINGS } from '@auth/configs/jwt-token-settings.config';
import { RefreshTokenGuard } from '@auth/guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async createSession(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Res() res: Response,
  ) {
    const { email, password } = authCredentialsDto;
    const user = await this.usersService.authenticateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken();
    const isRefreshTokenSaved = await this.authService.saveRefreshToken(
      user,
      refreshToken,
    );

    if (!isRefreshTokenSaved) {
      throw new InternalServerErrorException('Something went wrong, try again');
    }

    res.cookie(
      JWT_TOKEN_SETTINGS.ACCESS_TOKEN.name,
      accessToken,
      JWT_TOKEN_SETTINGS.ACCESS_TOKEN.options,
    );
    res.cookie(
      JWT_TOKEN_SETTINGS.REFRESH_TOKEN.name,
      refreshToken,
      JWT_TOKEN_SETTINGS.REFRESH_TOKEN.options,
    );

    return res.status(HttpStatus.OK).json({
      message: 'Login successful',
      email,
    });
  }

  @UseGuards(RefreshTokenGuard)
  @Post('token')
  async refreshSession(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.authService.exchangeRefreshToken(refreshToken);

    res.cookie(
      JWT_TOKEN_SETTINGS.ACCESS_TOKEN.name,
      tokens.accessToken,
      JWT_TOKEN_SETTINGS.ACCESS_TOKEN.options,
    );
    res.cookie(
      JWT_TOKEN_SETTINGS.REFRESH_TOKEN.name,
      tokens.refreshToken,
      JWT_TOKEN_SETTINGS.REFRESH_TOKEN.options,
    );

    return res.status(HttpStatus.OK).json({ message: 'Session refreshed' });
  }

  @Delete('logout')
  async deleteSession(@Req() req: Request, @Res() res: Response) {
    const refreshToken =
      req.refreshToken ?? req.cookies?.[JWT_TOKEN_SETTINGS.REFRESH_TOKEN.name];

    if (refreshToken) {
      await this.authService.removeRefreshToken(refreshToken);
    }

    res.clearCookie(
      JWT_TOKEN_SETTINGS.ACCESS_TOKEN.name,
      JWT_TOKEN_SETTINGS.ACCESS_TOKEN.options,
    );
    res.clearCookie(
      JWT_TOKEN_SETTINGS.REFRESH_TOKEN.name,
      JWT_TOKEN_SETTINGS.REFRESH_TOKEN.options,
    );

    return res
      .status(HttpStatus.OK)
      .json({ message: 'Logged out successfully' });
  }
}
