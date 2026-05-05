import { Request, Response } from 'express';
import { PrismaLinkRepository } from '../../database/prisma-link.repository';
import { GenerateLinkUseCase } from '../../../application/generate-link.use-case';

const linkRepository = new PrismaLinkRepository();
const generateLinkUseCase = new GenerateLinkUseCase(linkRepository);

export class LinkController {
  async generate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const finalUrl = await generateLinkUseCase.execute(id);
      
      return res.json({ url: finalUrl });
    } catch (error: any) {
      if (error.message === 'Link not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
