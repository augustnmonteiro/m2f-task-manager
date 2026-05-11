import { z } from 'zod';
import { UuidSchema } from './shared';

export const UpdateEmailSummaryIntervalInputSchema = z.object({
  intervalSeconds: z.number().int().positive(),
});

export const ProfileSchema = z.object({
  id: UuidSchema,
  email: z.string().nullable(),
  displayName: z.string().nullable(),
  emailSummaryIntervalSeconds: z.number().int().positive(),
});

export type Profile = z.infer<typeof ProfileSchema>;
