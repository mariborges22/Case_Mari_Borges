import request from 'supertest';
import { app } from '../../src/infrastructure/http/server';

describe('Health Check Integration', () => {
  it('should return status ok', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
