import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { GameItemResponseDto } from '@catalog/dto/game-item.response';

export class GetGamesResponseDto {
  items: GameItemResponseDto[];
  meta: PaginationMetaDto;
}
