import { IsOptional, IsString } from 'class-validator';

export class CreateStripeProductInput {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
