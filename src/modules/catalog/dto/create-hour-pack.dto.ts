import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateHourPackDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsInt()
  @IsOptional()
  stripeProductId?: number;

  @IsInt()
  stripePriceId: number;
}
