import amqp from 'amqplib';
import { v4 as uuid } from 'uuid';
import { IEventBus } from '../../domain/interfaces';

export class RabbitMQEventBus implements IEventBus {
  private connection?: amqp.Connection;
  private channel?: amqp.Channel;

  async publish(topic: string, message: any): Promise<void> {
    if (!this.connection) {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();
    }

    const messageId = uuid();
    const correlationId = message.correlationId || uuid();

    await this.channel?.assertExchange('campaign_events', 'topic', { durable: true });
    
    this.channel?.publish(
      'campaign_events', 
      topic, 
      Buffer.from(JSON.stringify(message)),
      {
        messageId,
        correlationId,
        persistent: true
      }
    );
  }
}
