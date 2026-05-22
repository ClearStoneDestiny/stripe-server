import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { GameItemResponseDto } from '@catalog/responses/game-item.response';

export class GetGamesResponseDto {
  items: GameItemResponseDto[];
  meta: PaginationMetaDto;
}
