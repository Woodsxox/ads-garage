import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Provider event ids we have already handled, so a redelivered webhook is acknowledged and skipped. */
@Entity('billing_events')
export class BillingEventRecord {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @CreateDateColumn()
  processedAt: Date;
}
