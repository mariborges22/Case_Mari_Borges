import * as amqp from 'amqplib';
import { v4 as uuid } from 'uuid';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

async function burst() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  const exchange = 'campaign_events';

  for (let i = 1; i <= 10; i++) {
    const messageId = uuid();
    const payload = JSON.stringify({ id: i, data: 'burst-test' });
    console.log(`Enviando mensagem #${i}: ${messageId}`);
    channel.publish(exchange, 'link.generated', Buffer.from(payload), { messageId });
  }

  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 2000);
}

burst();
