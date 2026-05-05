import { prisma } from './prisma-client';
import { ILinkRepository } from '../../domain/interfaces';
import { Link, LinkParameter, RedirectConfig } from '../../domain/entities';

export class PrismaLinkRepository implements ILinkRepository {
  private prisma = prisma;

  async create(link: Link): Promise<Link> {
    const created = await this.prisma.link.create({
      data: {
        id: link.id,
        name: link.name,
        baseUrl: link.baseUrl,
        projectId: link.projectId,
        parameters: {
          create: link.parameters
        },
        redirectConfig: link.redirect ? {
          create: {
            destinationUrl: link.redirect.destinationUrl
          }
        } : undefined
      },
      include: {
        parameters: true,
        redirectConfig: true
      }
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<Link | null> {
    const link = await this.prisma.link.findUnique({
      where: { id },
      include: {
        parameters: true,
        redirectConfig: true
      }
    });

    if (!link) return null;

    return this.mapToEntity(link);
  }

  async update(link: Link): Promise<Link> {
    // Usando transação para garantir consistência ao atualizar parâmetros
    return await this.prisma.$transaction(async (tx) => {
      await tx.linkParameter.deleteMany({ where: { linkId: link.id } });
      
      const updated = await tx.link.update({
        where: { id: link.id },
        data: {
          name: link.name,
          baseUrl: link.baseUrl,
          parameters: {
            create: link.parameters
          },
          redirectConfig: link.redirect ? {
            upsert: {
              create: { destinationUrl: link.redirect.destinationUrl },
              update: { destinationUrl: link.redirect.destinationUrl }
            }
          } : {
            delete: true
          }
        },
        include: {
          parameters: true,
          redirectConfig: true
        }
      });

      return this.mapToEntity(updated);
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.link.delete({ where: { id } });
  }

  async findAllByProjectId(projectId: string): Promise<Link[]> {
    const links = await this.prisma.link.findMany({
      where: { projectId },
      include: {
        parameters: true,
        redirectConfig: true
      }
    });

    return links.map(this.mapToEntity);
  }

  private mapToEntity(data: any): Link {
    return new Link(
      data.id,
      data.name,
      data.baseUrl,
      data.projectId,
      data.parameters.map((p: any) => ({ key: p.key, value: p.value })),
      data.redirectConfig ? { destinationUrl: data.redirectConfig.destinationUrl } : undefined
    );
  }
}
