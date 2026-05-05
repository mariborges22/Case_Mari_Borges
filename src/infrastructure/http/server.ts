import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { idempotencyMiddleware } from './middleware/idempotency';
import { LinkController } from './controllers/link.controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
const linkController = new LinkController();

// Routes v1
const router = express.Router();

router.get('/links/:id/generate', (req, res) => linkController.generate(req, res));

app.use('/api/v1', router);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(port, () => {
  console.log(`Servidor iniciado com sucesso 🚀🚀🚀`);
});
