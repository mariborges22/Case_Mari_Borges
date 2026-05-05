import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { IUserRepository } from '../domain/interfaces';
import { User } from '../domain/entities';

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(email: string, password: string): Promise<User> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User(uuid(), email, passwordHash);

    return await this.userRepository.create(user);
  }
}
