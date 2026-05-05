import * as amqp from 'amqplib';
import { v4 as uuid } from 'uuid';
import { IEventBus } from '../../domain/interfaces';

export class RabbitMQEventBus implements IEventBus {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async publish(topic: string, message: any): Promise<void> {
    if (!this.connection) {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    }
    
    if (!this.channel) {
      this.channel = await this.connection.createChannel();
    }

    const messageId = uuid();
    const correlationId = message.correlationId || uuid();

    if (!this.channel) {
      throw new Error('Failed to create RabbitMQ channel');
    }

    await this.channel.assertExchange('campaign_events', 'topic', { durable: true });
    
    this.channel.publish(
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
