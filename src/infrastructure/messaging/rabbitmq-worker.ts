import * as amqp from 'amqplib';
import Redis from 'ioredis';
import { logger } from '../../shared/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

const redis = new Redis(REDIS_URL, {
    tls: REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    family: 4
});

async function startWorker() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // 1. Configura a DLX (Dead Letter Exchange) e DLQ
    const dlx = 'campaign_events_dlx';
    const dlq = 'link_processing_queue_dlq';
    await channel.assertExchange(dlx, 'direct', { durable: true });
    await channel.assertQueue(dlq, { durable: true });
    await channel.bindQueue(dlq, dlx, 'dead_letter');

    // 2. Configura a fila principal com ligação para a DLX
    await channel.assertExchange('campaign_events', 'topic', { durable: true });
    const q = await channel.assertQueue('link_processing_queue_v2', { 
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlx,
        'x-dead-letter-routing-key': 'dead_letter'
      }
    });
    await channel.bindQueue(q.queue, 'campaign_events', 'link.generated');

    logger.info('Worker instável aguardando mensagens (v2)... 🐰🔥');

    channel.consume(q.queue, async (msg) => {
      if (msg) {
        const messageId = msg.properties.messageId;
        
        try {
            // --- SIMULAÇÃO DE CAOS (FLAKY WORKER) ---
            // 80% de chance de erro para testar a DLQ
            if (Math.random() < 0.8) {
                throw new Error('BOOM! Falha simulada no processador.');
            }

            // Lógica de Idempotência (mantida)
            const alreadyProcessed = await redis.get(`proc_msg:${messageId}`);
            if (alreadyProcessed) {
                logger.warn(`[IDEMPOTÊNCIA] Ignorado: ${messageId}`);
                channel.ack(msg);
                return;
            }

            logger.info(`[WORKER] Processado com sucesso: ${messageId}`);
            await redis.set(`proc_msg:${messageId}`, 'true', 'EX', 86400);
            channel.ack(msg);

        } catch (error: any) {
            logger.error(`[ERRO CRÍTICO] ${error.message} - Enviando para DLQ: ${messageId}`);
            // Rejeita SEM recolocar na fila principal (vai para DLQ)
            channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    logger.error('Worker Error:', error);
  }
}

// Inicia se for chamado diretamente
if (require.main === module) {
    startWorker();
}

export { startWorker };
