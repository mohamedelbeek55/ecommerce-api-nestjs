import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema — single source of truth for all environment variables
// ---------------------------------------------------------------------------

// NOTE: Zod v4 changed the error param names:
//   - `required_error` is removed — use `error: 'message'` for both cases
//   - `invalid_type_error` is removed — use `error: 'message'`

export const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string({ error: 'DATABASE_URL is required' })
    .url('DATABASE_URL must be a valid URL'),

  // Auth
  JWT_ACCESS_SECRET: z
    .string({ error: 'JWT_ACCESS_SECRET is required' })
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters for security'),
  JWT_REFRESH_SECRET: z
    .string({ error: 'JWT_REFRESH_SECRET is required' })
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security'),
  JWT_ACCESS_EXPIRES_IN: z.string().optional().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().optional().default('7d'),

  // Stripe test-mode credentials
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

  // Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// ---------------------------------------------------------------------------
// Inferred type — always in sync with the schema above
// ---------------------------------------------------------------------------

export type Env = z.infer<typeof envSchema>;

// ---------------------------------------------------------------------------
// Validate function — called by ConfigModule's `validate` option.
// Throws with a human-readable message on the first failure so the process
// exits immediately rather than crashing later with a cryptic runtime error.
// ---------------------------------------------------------------------------

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
