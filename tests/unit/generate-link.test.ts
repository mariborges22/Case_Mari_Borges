import { GenerateLinkUseCase } from '../../src/application/generate-link.use-case';
import { Link } from '../../src/domain/entities';

describe('GenerateLinkUseCase', () => {
  let useCase: GenerateLinkUseCase;
  let mockLinkRepository: any;
  let mockCacheService: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockLinkRepository = {
      findById: jest.fn()
    };
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn()
    };
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    };
    useCase = new GenerateLinkUseCase(mockLinkRepository, mockCacheService, mockEventBus);
  });

  it('should generate a link with parameters and cache it', async () => {
    const mockLink = new Link(
      'link-id',
      'Test Link',
      'https://example.com',
      'project-id',
      [{ key: 'utm_source', value: 'google' }]
    );

    mockLinkRepository.findById.mockResolvedValue(mockLink);
    mockCacheService.get.mockResolvedValue(null);

    const result = await useCase.execute('link-id');

    expect(result).toBe('https://example.com/?utm_source=google');
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'link:gen:link-id',
      'https://example.com/?utm_source=google',
      300
    );
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('should return cached link if available', async () => {
    mockCacheService.get.mockResolvedValue('https://cached-link.com');

    const result = await useCase.execute('link-id');

    expect(result).toBe('https://cached-link.com');
    expect(mockLinkRepository.findById).not.toHaveBeenCalled();
  });
});
