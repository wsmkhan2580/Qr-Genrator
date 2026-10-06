import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(255),
  password: z.string().min(1, 'Password is required.').max(200),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(200)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
    .regex(/[a-z]/, 'Password must contain a lowercase letter.')
    .regex(/[0-9]/, 'Password must contain a number.'),
  role: z.enum(['WORKER', 'MANAGER', 'ADMIN']).default('WORKER'),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(['WORKER', 'MANAGER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});
