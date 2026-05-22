import { SurpriseCollectionGameResponseDto } from '@catalog/responses/surprise-collection-game.response';
import { SurprisePlanResponseDto } from '@catalog/responses/surprise-plan.response';

export class SurpriseCollectionResponseDto {
  id: number;
  title: string;
  description?: string;
  periodStart: string;
  periodEnd: string;
  plan: SurprisePlanResponseDto;
  games: SurpriseCollectionGameResponseDto[];
}
