import { SurpriseCollectionGameResponseDto } from '@catalog/dto/surprise-collection-game.response';
import { SurprisePlanResponseDto } from '@catalog/dto/surprise-plan.response';

export class SurpriseCollectionResponseDto {
  id: number;
  title: string;
  description?: string;
  periodStart: string;
  periodEnd: string;
  plan: SurprisePlanResponseDto;
  games: SurpriseCollectionGameResponseDto[];
}
