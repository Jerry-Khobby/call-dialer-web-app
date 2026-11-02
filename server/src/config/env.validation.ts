export type Env = {
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  /** Comma-separated list of origins allowed to call the API (the Angular dev server by default). */
  CLIENT_ORIGIN: string;
  /** Optional TURN relay for callers behind strict NATs, e.g. a self-hosted coturn (free). */
  TURN_URL?: string;
  TURN_USERNAME?: string;
  TURN_CREDENTIAL?: string;
};

function read(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  return typeof value === 'string' ? value.trim() : '';
}

/** Fails fast at startup with every missing/invalid variable listed, instead of failing later at runtime. */
export function validateEnv(config: Record<string, unknown>): Env {
  const errors: string[] = [];

  const mongoUri = read(config, 'MONGODB_URI');
  if (!mongoUri)
    errors.push(
      'MONGODB_URI is required (e.g. mongodb://localhost:27017/call-dialer)',
    );

  const jwtSecret = read(config, 'JWT_SECRET');
  if (jwtSecret.length < 32)
    errors.push('JWT_SECRET is required and must be at least 32 characters');

  const port = Number(read(config, 'PORT') || 3000);
  if (!Number.isInteger(port) || port <= 0)
    errors.push('PORT must be a positive integer');

  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n  - ${errors.join('\n  - ')}`);
  }

  return {
    PORT: port,
    MONGODB_URI: mongoUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: read(config, 'JWT_EXPIRES_IN') || '7d',
    CLIENT_ORIGIN: read(config, 'CLIENT_ORIGIN') || 'http://localhost:4200',
    TURN_URL: read(config, 'TURN_URL') || undefined,
    TURN_USERNAME: read(config, 'TURN_USERNAME') || undefined,
    TURN_CREDENTIAL: read(config, 'TURN_CREDENTIAL') || undefined,
  };
}
