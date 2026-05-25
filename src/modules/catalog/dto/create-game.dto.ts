import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateGameDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  heroImageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  /**
   * Local subscription plan id
   */
  @IsOptional()
  @IsInt()
  requiredPlanId?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
