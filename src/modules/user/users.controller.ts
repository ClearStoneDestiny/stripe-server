import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { UsersService } from '@user/users.service';
import type { Response } from 'express';
import { AuthCredentialsDto } from '@/modules/auth/dto/inputs/auth-credentials.input';
import { UserRolesEnum } from '@user/enums/user-roles.enum';
import { IUserWithRole } from '@user/interfaces/user-with-role.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Res() res: Response,
  ): Promise<Response> {
    const { email, password } = authCredentialsDto;
    return this.saveUserWithRole({
      email,
      password,
      role: UserRolesEnum.USER,
      res,
    });
  }

  @Post('admin')
  async createAdmin(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Res() res: Response,
  ): Promise<Response> {
    const { email, password } = authCredentialsDto;
    return this.saveUserWithRole({
      email,
      password,
      role: UserRolesEnum.ADMIN,
      res,
    });
  }

  private async saveUserWithRole(
    userWithRoleData: IUserWithRole,
  ): Promise<Response> {
    const { email, password, role, res } = userWithRoleData;
    const existingUserWithRole = await this.usersService.findByEmail(email);

    if (existingUserWithRole) {
      throw new ConflictException(
        `${role} with this email is already registered`,
      );
    }

    await this.usersService.createUserWithRole({ email, password, role });
    return res!
      .status(HttpStatus.CREATED)
      .json({ message: `${role} created successfully!` });
  }

  @Get()
  async getUserByEmail(
    @Query('email') email: string,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return res.status(HttpStatus.OK).json(user);
  }
}
