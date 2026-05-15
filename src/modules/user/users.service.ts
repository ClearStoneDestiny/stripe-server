import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRolesEnum } from '@user/enums/user-roles.enum';
import { IUserWithRole } from '@user/interfaces/user-with-role.interface';
import { CreateUserInput } from '@user/dto/inputs/create-user.input';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const existingUser = await this.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = this.usersRepository.create({
      email: input.email,
      password: hashedPassword,
      role: UserRolesEnum.USER,
    });

    return this.usersRepository.save(user);
  }

  async createUserWithRole(data: IUserWithRole): Promise<User> {
    const existingUser = await this.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.usersRepository.create({
      email: data.email,
      password: hashedPassword,
      role: data.role ?? UserRolesEnum.USER,
    });

    return this.usersRepository.save(user);
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByIdOrFail(id: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async authenticateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email);

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }
}
