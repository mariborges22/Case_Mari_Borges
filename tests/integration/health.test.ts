import request from 'supertest';
import { app } from '../../src/infrastructure/http/server';
import { prisma } from '../../src/infrastructure/database/prisma-client';

describe('Health Check Integration', () => {
  it('should return status ok', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
