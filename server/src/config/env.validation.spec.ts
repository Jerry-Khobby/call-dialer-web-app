import { validateEnv } from './env.validation';

const valid = {
  MONGODB_URI: 'mongodb://localhost:27017/test',
  JWT_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults for optional settings', () => {
    expect(validateEnv(valid)).toMatchObject({
      PORT: 3000,
      JWT_EXPIRES_IN: '7d',
      CLIENT_ORIGIN: 'http://localhost:4200',
      TRUST_PROXY: false,
      TURN_URL: undefined,
    });
  });

  it('refuses the example JWT secret from .env.example', () => {
    expect(() =>
      validateEnv({
        ...valid,
        JWT_SECRET: 'change-me-to-a-long-random-string-of-at-least-32-chars',
      }),
    ).toThrow(/example value/);
  });

  it('reads TRUST_PROXY as a hop count or a boolean', () => {
    expect(validateEnv({ ...valid, TRUST_PROXY: '1' }).TRUST_PROXY).toBe(1);
    expect(validateEnv({ ...valid, TRUST_PROXY: 'true' }).TRUST_PROXY).toBe(
      true,
    );
    expect(validateEnv({ ...valid, TRUST_PROXY: 'false' }).TRUST_PROXY).toBe(
      false,
    );
    expect(() => validateEnv({ ...valid, TRUST_PROXY: 'yes' })).toThrow(
      /TRUST_PROXY must be/,
    );
  });

  it('lists every problem at once', () => {
    expect(() => validateEnv({ JWT_SECRET: 'short', PORT: 'abc' })).toThrow(
      /MONGODB_URI is required[\s\S]*JWT_SECRET[\s\S]*PORT must be/,
    );
  });
});
