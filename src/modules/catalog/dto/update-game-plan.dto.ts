import { IsInt, IsOptional } from 'class-validator';

export class UpdateGamePlanDto {
  @IsOptional()
  @IsInt()
  requiredPlanId?: number | null;
}
