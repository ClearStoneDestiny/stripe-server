import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetGamesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  /**
   * Subscription plan code to filter accessible games
   */
  @IsOptional()
  @IsString()
  planCode?: string;

  /**
   * Search query for game title
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Return extended information (description, required plan details)
   */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  extended?: boolean = false;
}
