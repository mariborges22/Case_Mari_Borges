import { Request, Response } from 'express';
import { PrismaLinkRepository } from '../../database/prisma-link.repository';
import { PrismaProjectRepository } from '../../database/prisma-project.repository';
import { RedisCacheService } from '../../cache/redis-cache.service';
import { RabbitMQEventBus } from '../../messaging/rabbitmq-event-bus';
import { GenerateLinkUseCase } from '../../../application/generate-link.use-case';
import { logger } from '../../../shared/logger';

const linkRepository = new PrismaLinkRepository();
const projectRepository = new PrismaProjectRepository();
const cacheService = new RedisCacheService();
const eventBus = new RabbitMQEventBus();
const generateLinkUseCase = new GenerateLinkUseCase(
  linkRepository, 
  projectRepository,
  cacheService, 
  eventBus
);

export class LinkController {
  async generate(req: Request, res: Response) {
    const maxAttempts = 3;
    let attempt = 1;
    let lastError;

    while (attempt <= maxAttempts) {
      try {
        const { id } = req.params;
        const userId = (req as any).userId; // Corrigido: o middleware usa req.userId
        
        const finalUrl = await generateLinkUseCase.execute(id, userId);
        return res.json({ url: finalUrl });

      } catch (error: any) {
        lastError = error;
        
        // Se for erro de permissão (IDOR), não adianta tentar de novo!
        if (error.message.includes('Forbidden')) break;

        logger.warn(`Tentativa #${attempt} falhou: ${error.message}. Tentando novamente...`);
        
        // Espera exponencial: 100ms, 200ms...
        await new Promise(res => setTimeout(res, attempt * 100));
        attempt++;
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const error = lastError;
    if (error.message.includes('Forbidden')) {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({ error: 'System busy. Please try again later.' });
  }
}
