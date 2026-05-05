import { Request, Response } from 'express';
import crypto from 'crypto';
import { PrismaLinkRepository } from '../../database/prisma-link.repository';
import { PrismaProjectRepository } from '../../database/prisma-project.repository';
import { Link } from '../../../domain/entities';

const linkRepository = new PrismaLinkRepository();
const projectRepository = new PrismaProjectRepository();

export class LinkManagementController {
  async create(req: any, res: Response) {
    try {
      const { name, baseUrl, projectId, parameters, redirect } = req.body;

      // Validação de posse do projeto
      const project = await projectRepository.findById(projectId);
      if (!project || project.userId !== req.userId) {
        return res.status(403).json({ error: 'Unauthorized to add links to this project' });
      }

      const link = new Link(
        crypto.randomUUID(),
        name,
        baseUrl,
        projectId,
        parameters || [],
        redirect
      );

      const created = await linkRepository.create(link);
      return res.status(201).json(created);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async list(req: any, res: Response) {
    const { projectId } = req.params;
    
    // Validação de posse do projeto
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const links = await linkRepository.findAllByProjectId(projectId);
    return res.json(links);
  }

  async delete(req: any, res: Response) {
    const { id } = req.params;
    const link = await linkRepository.findById(id);

    if (!link) return res.status(404).json({ error: 'Link not found' });

    const project = await projectRepository.findById(link.projectId);
    if (!project || project.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await linkRepository.delete(id);
    return res.status(204).send();
  }
}
