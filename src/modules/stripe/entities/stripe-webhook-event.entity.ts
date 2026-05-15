import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@common/entities/base-entity.entity';
import { StripeWebhookProcessingStatusEnum } from '@stripe/enums/stripe-webhook-processing-status.enum';

/**
 * Storing and deduplication of webhook events
 */
@Entity('stripe_webhook_events')
export class StripeWebhookEvent extends BaseEntity {
  @Column({ name: 'stripe_event_id', unique: true })
  stripeEventId: string;

  @Column()
  type: string;

  @Column({
    type: 'enum',
    enum: StripeWebhookProcessingStatusEnum,
    default: StripeWebhookProcessingStatusEnum.PENDING,
  })
  status: StripeWebhookProcessingStatusEnum;

  @Column({
    name: 'processed_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  processedAt?: Date;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason?: string;

  @Column({ default: false })
  livemode: boolean;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;
}
