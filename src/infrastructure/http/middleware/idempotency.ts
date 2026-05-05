import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-idempotency-key'] as string;

  if (!key) {
    return next();
  }

  // Verifica se a chave já existe e não expirou
  const record = await prisma.idempotencyKey.findFirst({
    where: {
      key,
      expiresAt: { gt: new Date() }
    }
  });

  if (record) {
    const savedResponse = JSON.parse(record.response);
    return res.status(savedResponse.status).json(savedResponse.body);
  }

  // Intercepta o send para salvar a resposta
  const originalSend = res.json;
  res.json = (body: any): Response => {
    // Salva a resposta de forma assíncrona para não travar o cliente
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expira em 24h

    prisma.idempotencyKey.create({
      data: {
        key,
        response: JSON.stringify({ status: res.statusCode, body }),
        expiresAt
      }
    }).catch(err => console.error('Erro ao salvar chave de idempotência:', err));

    return originalSend.call(res, body);
  };

  next();
};
