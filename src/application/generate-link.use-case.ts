import { ILinkRepository, IProjectRepository, ICacheService, IEventBus } from '../domain/interfaces';
import { logger } from '../shared/logger';

export class GenerateLinkUseCase {
  constructor(
    private linkRepository: ILinkRepository,
    private projectRepository: IProjectRepository,
    private cacheService: ICacheService,
    private eventBus: IEventBus
  ) {}

  async execute(linkId: string, userId: string): Promise<string> {
    // 1. Tenta buscar no Cache (Redis)
    try {
      const cachedUrl = await this.cacheService.get(`link:gen:${linkId}`);
      if (cachedUrl) {
        logger.info('Link serving from cache', { linkId });
        return cachedUrl;
      }
    } catch (err) {
      logger.warn('Cache unavailable, falling back to database', { linkId });
    }

    // 2. Busca no Banco
    const link = await this.linkRepository.findById(linkId);

    if (!link) {
      logger.error('Link not found', { linkId });
      throw new Error('Link not found');
    }

    // --- PROTEÇÃO IDOR ---
    // Verifica se o projeto do link pertence ao usuário logado
    const project = await this.projectRepository.findById(link.projectId);
    if (!project || project.userId !== userId) {
      logger.warn('IDOR Attempt detected!', { userId, linkId, projectId: link.projectId });
      throw new Error('Forbidden: You do not have access to this link');
    }

    // 3. Geração dinâmica
    const url = new URL(link.baseUrl);
    link.parameters.forEach(param => {
      url.searchParams.append(param.key, param.value);
    });

    let finalUrl = url.toString();

    if (link.redirect) {
      const redirectUrl = new URL(link.redirect.destinationUrl);
      url.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.append(key, value);
      });
      finalUrl = redirectUrl.toString();
    }

    // 4. Salva no Cache (expira em 5 min para garantir consistência eventual)
    try {
      await this.cacheService.set(`link:gen:${linkId}`, finalUrl, 300);
    } catch (err) {
      logger.warn('Failed to save to cache', { linkId });
    }

    // 5. Dispara evento assíncrono (RabbitMQ)
    this.eventBus.publish('link.generated', {
      linkId,
      finalUrl,
      timestamp: new Date()
    }).catch(err => logger.error('Failed to publish event', { err }));

    return finalUrl;
  }
}
