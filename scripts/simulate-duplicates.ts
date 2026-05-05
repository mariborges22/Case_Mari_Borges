import * as amqp from 'amqplib';
import { v4 as uuid } from 'uuid';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

async function simulate() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  
  const exchange = 'campaign_events';
  await channel.assertExchange(exchange, 'topic', { durable: true });

  const messageId = uuid();
  const payload = JSON.stringify({ 
    event: 'link.generated', 
    data: { linkId: 'test-123', timestamp: new Date() } 
  });

  console.log(`--- Enviando Mensagem Original: ${messageId} ---`);
  channel.publish(exchange, 'link.generated', Buffer.from(payload), { messageId });

  setTimeout(() => {
    console.log(`--- Enviando Mensagem DUPLICADA: ${messageId} ---`);
    channel.publish(exchange, 'link.generated', Buffer.from(payload), { messageId });
    
    setTimeout(() => {
        connection.close();
        process.exit(0);
    }, 2000);
  }, 3000);
}

simulate();
