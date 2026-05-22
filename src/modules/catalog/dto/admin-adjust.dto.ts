import { IsInt, IsOptional, IsString } from 'class-validator';

export class AdminAdjustDto {
  @IsInt()
  userId: number;

  @IsInt()
  minutes: number; // positive number — replenishment, negative number - write-off

  @IsString()
  @IsOptional()
  reason?: string;
}
