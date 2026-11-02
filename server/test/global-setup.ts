import { MongoMemoryServer } from 'mongodb-memory-server';

// One in-memory MongoDB for the whole e2e run. Env vars set here are inherited by the
// test workers, so AppModule's config validation sees them when it is imported.
export default async function globalSetup() {
  const mongo = await MongoMemoryServer.create();
  (globalThis as { __MONGO__?: MongoMemoryServer }).__MONGO__ = mongo;

  process.env.MONGODB_URI = mongo.getUri('call-dialer-e2e');
  process.env.JWT_SECRET = 'e2e-secret-that-is-definitely-longer-than-32-chars';
  process.env.CLIENT_ORIGIN = 'http://localhost:4200';
}
