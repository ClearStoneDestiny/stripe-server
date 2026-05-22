export class GameTimeBalanceResponse {
  availableMinutes: number;
  availableHours: number; // availableMinutes / 60, rounded
  usedMinutes: number;
  usedHours: number;
  totalMinutes: number;
  totalHours: number;
  currentMonth: string;
  nextResetAt: Date; // first date of next month
}
