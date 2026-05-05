import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/logger';
import { dbQueryDurationSeconds } from '../http/middleware/metrics';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
});

// Middleware para medir tempo de query
prisma.$use(async (params, next) => {
  const start = process.hrtime();
  
  const result = await next(params);
  
  const duration = process.hrtime(start);
  const durationInSeconds = duration[0] + duration[1] / 1e9;
  
  // Log de queries lentas (> 100ms)
  if (durationInSeconds > 0.1) {
    logger.warn('Slow query detected', {
      model: params.model,
      action: params.action,
      duration: durationInSeconds
    });
  }

  // Envia métrica para Prometheus
  dbQueryDurationSeconds.observe(
    { model: params.model || 'other', action: params.action },
    durationInSeconds
  );

  return result;
});

// Evento de query para log detalhado (opcional em dev)
if (process.env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (e: any) => {
    logger.info('Prisma Query', { query: e.query, params: e.params, duration: e.duration });
  });
}

export { prisma };
