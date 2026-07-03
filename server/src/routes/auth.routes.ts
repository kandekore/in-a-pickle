import { Router } from 'express';
import { z } from 'zod';
import { login, refresh, register } from '../services/auth.service.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { publicUser } from '../services/auth.service.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(['customer', 'provider']).optional(),
});

authRouter.post(
  '/auth/register',
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const result = await register(input);
    res.status(201).json(result);
  }),
);

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await login(email, password);
    res.json(result);
  }),
);

authRouter.post(
  '/auth/refresh',
  asyncHandler(async (req, res) => {
    const token = z.object({ refresh: z.string() }).parse(req.body).refresh;
    res.json(refresh(token));
  }),
);

authRouter.get(
  '/auth/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth!.sub);
    if (!user) throw new HttpError(404, 'User not found');
    res.json({ user: publicUser(user) });
  }),
);
