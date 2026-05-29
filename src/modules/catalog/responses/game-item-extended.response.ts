import { GameItemResponseDto } from "./game-item.response";

/**
 * Extended game item (when extended=true)
 */
export class GameItemExtendedResponseDto extends GameItemResponseDto {
  description?: string;
  requiredPlan?: {
    id: number;
    code: string;
    name: string;
    sortOrder: number;
  } | null;
}
