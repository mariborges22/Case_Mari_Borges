import request from 'supertest';
import { app } from '../../src/infrastructure/http/server';
import { prisma } from '../../src/infrastructure/database/prisma-client';

describe('Observability Verification', () => {
  it('should expose prometheus metrics', async () => {
    const response = await request(app).get('/api/v1/metrics');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('http_request_duration_seconds');
    expect(response.text).toContain('db_query_duration_seconds');
    expect(response.text).toContain('redis_cache_requests_total');
  });

  it('should track correlation-id across layers', async () => {
    const correlationId = 'test-trace-id';
    const response = await request(app)
      .get('/health')
      .set('X-Correlation-ID', correlationId);
    
    expect(response.headers['x-correlation-id']).toBe(correlationId);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
