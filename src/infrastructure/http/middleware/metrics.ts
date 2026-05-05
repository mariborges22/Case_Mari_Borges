import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Registro padrão de métricas
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Métrica para tempo de resposta HTTP
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10]
});

// Métrica para tempo de queries no Banco
export const dbQueryDurationSeconds = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of Database queries in seconds',
  labelNames: ['model', 'action'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

// Métrica para Cache (Hit/Miss)
export const redisCacheRequestsTotal = new client.Counter({
  name: 'redis_cache_requests_total',
  help: 'Total number of Redis cache requests',
  labelNames: ['result'] // 'hit' ou 'miss'
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    
    httpRequestDurationMicroseconds
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(durationInSeconds);
  });

  next();
};

export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
};
