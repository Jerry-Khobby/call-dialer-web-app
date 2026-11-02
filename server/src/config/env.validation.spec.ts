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
      TURN_URL: undefined,
    });
  });

  it('lists every problem at once', () => {
    expect(() => validateEnv({ JWT_SECRET: 'short', PORT: 'abc' })).toThrow(
      /MONGODB_URI is required[\s\S]*JWT_SECRET[\s\S]*PORT must be/,
    );
  });
});
