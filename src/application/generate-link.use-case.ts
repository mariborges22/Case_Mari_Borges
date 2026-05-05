import { ILinkRepository, ICacheService, IEventBus } from '../domain/interfaces';
import { logger } from '../shared/logger';

export class GenerateLinkUseCase {
  constructor(
    private linkRepository: ILinkRepository,
    private cacheService: ICacheService,
    private eventBus: IEventBus
  ) {}

  async execute(linkId: string): Promise<string> {
    // 1. Tenta buscar no Cache (Redis)
    const cachedUrl = await this.cacheService.get(`link:gen:${linkId}`);
    if (cachedUrl) {
      logger.info('Link serving from cache', { linkId });
      return cachedUrl;
    }

    // 2. Busca no Banco
    const link = await this.linkRepository.findById(linkId);

    if (!link) {
      logger.error('Link not found', { linkId });
      throw new Error('Link not found');
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
    await this.cacheService.set(`link:gen:${linkId}`, finalUrl, 300);

    // 5. Dispara evento assíncrono (RabbitMQ)
    this.eventBus.publish('link.generated', {
      linkId,
      finalUrl,
      timestamp: new Date()
    }).catch(err => logger.error('Failed to publish event', { err }));

    return finalUrl;
  }
}
