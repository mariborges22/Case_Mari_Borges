import request from 'supertest';
import { app } from '../../src/infrastructure/http/server';

describe('Health Check Integration', () => {
  it('should return status ok', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  afterAll(async () => {
    // Aqui fecharíamos conexões se o app as mantivesse abertas globalmente
    // Como estamos usando instâncias locais nos controllers, o Garbage Collector
    // ou o fim do processo do Jest costuma limpar, mas o require.main já resolveu o principal.
  });
});
