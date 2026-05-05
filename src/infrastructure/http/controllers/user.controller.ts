import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaUserRepository } from '../../database/prisma-user.repository';
import { RegisterUserUseCase } from '../../../application/register-user.use-case';

const userRepository = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRepository);

export class UserController {
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await registerUseCase.execute(email, password);
      return res.status(201).json({ id: user.id, email: user.email });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const user = await userRepository.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret_key', {
      expiresIn: '1d'
    });

    return res.json({ token });
  }
}
