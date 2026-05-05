import { ILinkRepository } from '../domain/interfaces';

export class GenerateLinkUseCase {
  constructor(private linkRepository: ILinkRepository) {}

  async execute(linkId: string): Promise<string> {
    const link = await this.linkRepository.findById(linkId);

    if (!link) {
      throw new Error('Link not found');
    }

    // Geração dinâmica do link
    const url = new URL(link.baseUrl);

    // Adiciona parâmetros dinâmicos (UTMs, etc)
    link.parameters.forEach(param => {
      url.searchParams.append(param.key, param.value);
    });

    // Se houver configuração de redirect, podemos adicionar um parâmetro de destino
    // ou simplesmente retornar a URL baseada na regra de negócio.
    // Exemplo: se houver redirect, a URL final pode ser o destino com os UTMs.
    if (link.redirect) {
      const redirectUrl = new URL(link.redirect.destinationUrl);
      url.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.append(key, value);
      });
      return redirectUrl.toString();
    }

    return url.toString();
  }
}
