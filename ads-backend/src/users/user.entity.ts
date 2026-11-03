import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Role } from '../common/auth-user.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stored lower-cased. Unique. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 254 })
  email: string;

  /** Never selected by default, so it cannot leak into a response by accident. */
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', length: 16, default: 'user' })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
