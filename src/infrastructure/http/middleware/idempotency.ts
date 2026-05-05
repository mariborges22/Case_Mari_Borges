import { Request, Response, NextFunction } from 'express';
import { RedisCacheService } from '../../cache/redis-cache.service';

const cacheService = new RedisCacheService();

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-idempotency-key'] as string;

  if (!key) {
    return next();
  }

  // Verifica no Redis
  const cachedResponse = await cacheService.get(`idempotency:${key}`);

  if (cachedResponse) {
    const savedResponse = JSON.parse(cachedResponse);
    return res.status(savedResponse.status).json(savedResponse.body);
  }

  // Intercepta o send para salvar a resposta no Redis
  const originalSend = res.json;
  res.json = (body: any): Response => {
    // Expira em 24h (86400 segundos)
    cacheService.set(
      `idempotency:${key}`, 
      JSON.stringify({ status: res.statusCode, body }), 
      86400
    ).catch((err: Error) => console.error('Erro ao salvar idempotência no Redis:', err));

    return originalSend.call(res, body);
  };

  next();
};
