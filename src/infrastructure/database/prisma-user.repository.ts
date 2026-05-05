import { prisma } from './prisma-client';
import { IUserRepository } from '../../domain/interfaces';
import { User } from '../../domain/entities';

export class PrismaUserRepository implements IUserRepository {
  private prisma = prisma;

  async create(user: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        password: user.passwordHash
      }
    });
    return new User(created.id, created.email, created.password);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return new User(user.id, user.email, user.password);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return new User(user.id, user.email, user.password);
  }
}
