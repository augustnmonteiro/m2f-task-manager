import { z } from 'zod';

export const UuidSchema = z.string().uuid();

export const DatetimeSchema = z.string().datetime();
