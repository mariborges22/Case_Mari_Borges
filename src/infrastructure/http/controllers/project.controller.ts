import { Request, Response } from 'express';
import { PrismaProjectRepository } from '../../database/prisma-project.repository';
import { Project } from '../../../domain/entities';
import { v4 as uuid } from 'uuid'; // Usaremos crypto.randomUUID se preferir, mas para o exemplo:

const projectRepository = new PrismaProjectRepository();

export class ProjectController {
  async create(req: any, res: Response) {
    try {
      const { name } = req.body;
      const project = new Project(crypto.randomUUID(), name, req.userId);
      const created = await projectRepository.create(project);
      return res.status(201).json(created);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async list(req: any, res: Response) {
    try {
      const projects = await projectRepository.findAllByUserId(req.userId);
      return res.json(projects);
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: any, res: Response) {
    try {
      const { id } = req.params;
      const project = await projectRepository.findById(id);

      if (!project || project.userId !== req.userId) {
        return res.status(404).json({ error: 'Project not found' });
      }

      await projectRepository.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
