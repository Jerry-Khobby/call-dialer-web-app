// Starts the API for the end-to-end tests: builds the server, starts a throwaway in-memory
// MongoDB (mongodb-memory-server, already a server devDependency), and runs the built API
// against it. Everything stops when Playwright stops this process.
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const serverDir = fileURLToPath(new URL('../../server/', import.meta.url));
const require = createRequire(new URL('../../server/package.json', import.meta.url));
const { MongoMemoryServer } = require('mongodb-memory-server');

const build = spawnSync('npm', ['run', 'build'], { cwd: serverDir, stdio: 'inherit', shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
const api = spawn(process.execPath, ['dist/main.js'], {
  cwd: serverDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.API_PORT ?? '3399',
    MONGODB_URI: mongo.getUri('dialer-e2e'),
    JWT_SECRET: randomBytes(32).toString('hex'),
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:4399',
  },
});

let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill();
  await mongo.stop();
  process.exit(code);
}
api.on('exit', (code) => void stop(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => void stop());
