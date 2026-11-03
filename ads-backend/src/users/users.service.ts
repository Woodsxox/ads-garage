import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOneBy({ email: email.toLowerCase() });
  }

  /** Login only: the one place the password hash is selected. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async create(input: { email: string; passwordHash: string; displayName?: string | null }): Promise<User> {
    const email = input.email.toLowerCase();
    // Check first for a friendly error; the unique index still guards against a concurrent signup.
    if (await this.users.existsBy({ email })) {
      throw new ConflictException({ message: 'An account with this email already exists', code: 'EMAIL_TAKEN' });
    }
    try {
      return await this.users.save(
        this.users.create({ email, passwordHash: input.passwordHash, displayName: input.displayName ?? null }),
      );
    } catch (error) {
      if (await this.users.existsBy({ email })) {
        throw new ConflictException({ message: 'An account with this email already exists', code: 'EMAIL_TAKEN' });
      }
      throw error;
    }
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.users.update({ id }, { passwordHash });
  }

  async updateProfile(id: string, patch: { displayName?: string | null }): Promise<User | null> {
    await this.users.update({ id }, patch);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.users.delete({ id });
  }
}
