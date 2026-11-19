import { z } from 'zod';

/** Same rule as the API: digits, spaces, dashes and parentheses, with at least 6 digits. */
export const PHONE_REGEX = /^(?=(?:\D*\d){6})\+?[0-9 ()-]{6,20}$/;

export const clientDetailsSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(80),
  phone: z.string().trim().regex(PHONE_REGEX, 'Please enter a valid phone number'),
  email: z.union([z.literal(''), z.string().trim().email('Please enter a valid email')]),
  notes: z.string().max(300).optional(),
});
export type ClientDetails = z.infer<typeof clientDetailsSchema>;
