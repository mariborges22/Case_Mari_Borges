import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { v4 as uuid } from 'uuid';
import { idempotencyMiddleware } from './middleware/idempotency';
import { authMiddleware } from './middleware/auth';
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics';
import { logger } from '../../shared/logger';
import { LinkController } from './controllers/link.controller';
import { UserController } from './controllers/user.controller';
import { ProjectController } from './controllers/project.controller';
import { LinkManagementController } from './controllers/link-management.controller';

dotenv.config();

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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: 'Muitas requisições vindas deste IP, tente novamente mais tarde.'
});
app.use(limiter);

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
router.post('/users/register', (req, res) => userController.register(req, res));
router.post('/users/login', (req, res) => userController.login(req, res));
router.get('/metrics', metricsEndpoint);

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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Servidor iniciado com sucesso 🚀🚀🚀`);
  });
}

export { app };
