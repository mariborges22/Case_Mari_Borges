import { PrismaLinkRepository } from '../../database/prisma-link.repository';
import { RedisCacheService } from '../../cache/redis-cache.service';
import { RabbitMQEventBus } from '../../messaging/rabbitmq-event-bus';
import { GenerateLinkUseCase } from '../../../application/generate-link.use-case';

const linkRepository = new PrismaLinkRepository();
const cacheService = new RedisCacheService();
const eventBus = new RabbitMQEventBus();
const generateLinkUseCase = new GenerateLinkUseCase(linkRepository, cacheService, eventBus);

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
