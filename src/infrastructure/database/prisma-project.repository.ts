import { prisma } from './prisma-client';
import { IProjectRepository } from '../../domain/interfaces';
import { Project } from '../../domain/entities';

export class PrismaProjectRepository implements IProjectRepository {
  private prisma = prisma;

  async create(project: Project): Promise<Project> {
    const created = await this.prisma.project.create({
      data: {
        id: project.id,
        name: project.name,
        userId: project.userId
      }
    });
    return new Project(created.id, created.name, created.userId);
  }

  async findAllByUserId(userId: string): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({ where: { userId } });
    return projects.map(p => new Project(p.id, p.name, p.userId));
  }

  async findById(id: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) return null;
    return new Project(project.id, project.name, project.userId);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }
}
