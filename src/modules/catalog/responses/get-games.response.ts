import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { GameItemResponseDto } from '@catalog/responses/game-item.response';
import { GameItemExtendedResponseDto } from '@catalog/responses/game-item-extended.response';

export class GetGamesResponseDto {
  items: GameItemResponseDto[] | GameItemExtendedResponseDto[];
  meta: PaginationMetaDto;
}
