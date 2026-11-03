import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity.js';

/**
 * A refresh token is `<id>.<secret>`. Only a SHA-256 of the secret is stored, so a database leak
 * does not yield usable tokens. Tokens are single-use: each refresh revokes the old one.
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ type: Date })
  expiresAt: Date;

  @Column({ type: Date, nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  replacedById: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
