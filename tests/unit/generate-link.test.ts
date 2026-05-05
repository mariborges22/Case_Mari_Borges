import { GenerateLinkUseCase } from '../../src/application/generate-link.use-case';
import { Link } from '../../src/domain/entities';

describe('GenerateLinkUseCase', () => {
  let useCase: GenerateLinkUseCase;
  let mockLinkRepository: any;
  let mockProjectRepository: any;
  let mockCacheService: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockLinkRepository = {
      findById: jest.fn()
    };
    mockProjectRepository = {
      findById: jest.fn()
    };
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn()
    };
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    };
    useCase = new GenerateLinkUseCase(mockLinkRepository, mockProjectRepository, mockCacheService, mockEventBus);
  });

  it('should generate a link and save to cache if not cached', async () => {
    const mockLink = {
      id: 'link-id',
      baseUrl: 'https://loja.com/produto',
      projectId: 'proj-123',
      parameters: [{ key: 'utm_source', value: 'facebook' }]
    };

    const mockProject = { id: 'proj-123', userId: 'user-456' };

    mockLinkRepository.findById.mockResolvedValue(mockLink);
    mockProjectRepository.findById.mockResolvedValue(mockProject);
    mockCacheService.get.mockResolvedValue(null);

    const result = await useCase.execute('link-id', 'user-456');

    expect(result).toBe('https://loja.com/produto?utm_source=facebook');
    expect(mockCacheService.set).toHaveBeenCalled();
  });

  it('should return cached link if available', async () => {
    mockCacheService.get.mockResolvedValue('https://cached-link.com');

    const result = await useCase.execute('link-id', 'user-456');

    expect(result).toBe('https://cached-link.com');
    expect(mockLinkRepository.findById).not.toHaveBeenCalled();
  });
});
