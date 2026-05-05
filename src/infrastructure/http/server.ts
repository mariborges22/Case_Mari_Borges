import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { v4 as uuid } from 'uuid';
import { idempotencyMiddleware } from './middleware/idempotency';
import { authMiddleware } from './middleware/auth';
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics';
import { logger } from '../../shared/logger';
import { LinkController } from './controllers/link.controller';
import { UserController } from './controllers/user.controller';
import { ProjectController } from './controllers/project.controller';
import { LinkManagementController } from './controllers/link-management.controller';
import { prisma } from '../database/prisma-client';

const app = express();
const port = process.env.PORT || 3000;

// Correlation ID & Metrics
app.use((req: any, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuid();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});
app.use(metricsMiddleware);

// Security Middlewares
app.use(helmet()); // Proteção de headers
app.use(cors());
app.use(express.json()); // Apenas JSON (Anti-XML)
app.use(morgan('dev'));

// Rate Limiting (DDoS protection)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Muitas requisições vindas deste IP.'
});

// Limiter Rígido para Autenticação (Anti-Brute Force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Idempotency
app.use(idempotencyMiddleware);

// Controllers
const userController = new UserController();
const projectController = new ProjectController();
const linkController = new LinkController();
const linkManagementController = new LinkManagementController();

// Routes v1
const router = express.Router();

// Public Routes
router.post('/users/register', authLimiter, (req, res) => userController.register(req, res));
router.post('/users/login', authLimiter, (req, res) => userController.login(req, res));
router.get('/metrics', metricsEndpoint);

// Endpoint para teste de Graceful Shutdown (Lento de propósito)
router.get('/chaos/slow', async (req, res) => {
  logger.warn('🐢 Iniciando requisição lenta (5s)...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  res.json({ message: 'Concluída com sucesso mesmo após sinal de desligamento!' });
});

// Protected Routes
router.use(authMiddleware);

// Projects
router.post('/projects', (req, res) => projectController.create(req, res));
router.get('/projects', (req, res) => projectController.list(req, res));
router.delete('/projects/:id', (req, res) => projectController.delete(req, res));

// Link Management
router.post('/links', (req, res) => linkManagementController.create(req, res));
router.get('/projects/:projectId/links', (req, res) => linkManagementController.list(req, res));
router.delete('/links/:id', (req, res) => linkManagementController.delete(req, res));

// Link Generation (Dynamic)
router.get('/links/:id/generate', (req, res) => linkController.generate(req, res));

app.use('/api/v1', router);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const server = app.listen(port, () => {
  logger.info(`🚀 Server running on port ${port}`);
});

// --- GRACEFUL SHUTDOWN LOGIC ---
const shutdown = async (signal: string) => {
  logger.warn(`\n🛑 Recebido ${signal}. Iniciando encerramento gracioso...`);
  
  // 1. Define um timeout de segurança para forçar o fechamento se demorar demais
  const forceExitTimeout = setTimeout(() => {
    logger.error('⚠️ Forçando encerramento (timeout de 10s atingido)');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  // 2. Para de aceitar novas conexões e espera as atuais terminarem
  server.close(async () => {
    logger.info('✅ Conexões HTTP finalizadas.');
    
    try {
      // 3. Fecha conexões de infraestrutura APÓS as requisições terminarem
      await prisma.$disconnect();
      logger.info('✅ Banco de dados desconectado.');

      clearTimeout(forceExitTimeout);
      logger.info('🚀 Sistema encerrado com sucesso. Até logo! 👋');
      process.exit(0);
    } catch (err) {
      logger.error('❌ Erro ao fechar banco de dados:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app };
