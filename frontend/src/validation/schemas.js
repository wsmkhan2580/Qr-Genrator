import { z } from 'zod';

const PHONE_REGEX = /^\+?[0-9][0-9\s\-().]{6,18}[0-9]$/;

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const ticketFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Customer name must be at least 2 characters.')
    .max(160, 'Customer name is too long.'),
  customerPhone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Enter a valid phone number, e.g. 98765 43210.'),
  customerEmail: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .optional()
    .or(z.literal('')),
  eventName: z
    .string()
    .trim()
    .min(2, 'Event name must be at least 2 characters.')
    .max(200, 'Event name is too long.'),
  eventDate: z.string().min(1, 'Event date is required.'),
  ticketType: z.string().trim().min(1, 'Select a ticket type.'),
  quantity: z
    .coerce.number({ invalid_type_error: 'Quantity must be a number.' })
    .int('Quantity must be a whole number.')
    .positive('Quantity must be at least 1.')
    .max(1000, 'Quantity must be 1000 or fewer.'),
});

export const workerFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Add an uppercase letter.')
    .regex(/[a-z]/, 'Add a lowercase letter.')
    .regex(/[0-9]/, 'Add a number.'),
  role: z.enum(['WORKER', 'MANAGER', 'ADMIN']),
});

export const validateCodeSchema = z.object({
  code: z.string().trim().min(3, 'Enter or scan a ticket code.'),
});
