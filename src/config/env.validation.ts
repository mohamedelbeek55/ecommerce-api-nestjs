import { z } from 'zod';

// Rejects placeholder values so a copied .env.example cannot boot the app
const jwtSecret = (name: string) =>
  z
    .string({ error: `${name} is required` })
    .min(32, `${name} must be at least 32 characters for security`)
    .refine(
      (val) => !val.startsWith('replace-with'),
      `${name} must be a real secret, not the placeholder from .env.example. ` +
      `Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );

export const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string({ error: 'DATABASE_URL is required' })
    .url('DATABASE_URL must be a valid URL'),

  // Auth
  JWT_ACCESS_SECRET: jwtSecret('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: jwtSecret('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: z.string().optional().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().optional().default('7d'),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string({ error: 'STRIPE_SECRET_KEY is required' })
    .min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z
    .string({ error: 'STRIPE_WEBHOOK_SECRET is required' })
    .min(1, 'STRIPE_WEBHOOK_SECRET is required'),

  // Server
  PORT: z
    .string()
    .optional()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535)),

  // Set to "true" only when running behind a trusted reverse proxy (Render, Heroku, nginx)
  TRUST_PROXY: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true' || v === '1')
    .pipe(z.boolean()),

  // Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Email (Nodemailer / SMTP)
  EMAIL_HOST: z.string({ error: 'EMAIL_HOST is required' }).min(1),
  EMAIL_PORT: z
    .string({ error: 'EMAIL_PORT is required' })
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(65535)),
  EMAIL_USER: z.string({ error: 'EMAIL_USER is required' }).min(1),
  EMAIL_PASS: z.string({ error: 'EMAIL_PASS is required' }).min(1),
  EMAIL_FROM: z
    .string({ error: 'EMAIL_FROM is required' })
    .email('EMAIL_FROM must be a valid email'),
  EMAIL_SECURE: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true')
    .pipe(z.boolean()),

  FRONTEND_URL: z
    .string({ error: 'FRONTEND_URL is required' })
    .url('FRONTEND_URL must be a valid URL'),
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return result.data;
}