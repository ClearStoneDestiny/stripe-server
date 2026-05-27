import { GameTimeTransactionTypeEnum } from '@catalog/enums/game-time-transaction-type.enum';

export class GameTimeTransactionResponse {
  id: number;
  type: GameTimeTransactionTypeEnum;
  minutes: number;
  hours: number;
  reason?: string;
  createdAt: Date;
}
