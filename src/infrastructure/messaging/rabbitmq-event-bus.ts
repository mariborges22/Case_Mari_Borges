import * as amqp from 'amqplib';
import { v4 as uuid } from 'uuid';
import { IEventBus } from '../../domain/interfaces';

export class RabbitMQEventBus implements IEventBus {
  private connection: any = null;
  private channel: any = null;

  async publish(topic: string, message: any): Promise<void> {
    try {
      if (!this.connection) {
        this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      }
      
      if (!this.channel) {
        this.channel = await this.connection.createChannel();
      }

      const messageId = uuid();
      const correlationId = message.correlationId || uuid();

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
    } catch (error) {
      console.error('RabbitMQ Publish Error:', error);
      // Não re-throw se for apenas log, mas aqui queremos consistência
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}
