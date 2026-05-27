export class HourPackResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  durationMinutes: number;
  durationHours: number;
  sortOrder: number;
  stripePrice: {
    id: number;
    unitAmount: number;
    currency: string;
  };
}
