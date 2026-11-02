// Free local MongoDB for development, with nothing to install: mongodb-memory-server
// downloads the official mongod binary once, and data is kept in server/.mongo-data so
// it survives restarts. Run with `npm run db`, then start the API in another terminal.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dbPath = fileURLToPath(new URL('../.mongo-data', import.meta.url));
mkdirSync(dbPath, { recursive: true });

const mongo = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: 'wiredTiger' },
});
console.log(`MongoDB is running at ${mongo.getUri()}`);
console.log(`Data is stored in ${dbPath}. Press Ctrl+C to stop.`);

const stop = async () => {
  await mongo.stop({ doCleanup: false }); // keep the data
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
