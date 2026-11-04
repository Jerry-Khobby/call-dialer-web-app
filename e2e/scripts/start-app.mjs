// Starts the whole app for the end-to-end tests, as it is deployed: builds the client and
// the server, starts a throwaway in-memory MongoDB (mongodb-memory-server, already a server
// devDependency), and runs the built server, which serves the app and the API on one port.
// Everything stops when Playwright stops this process.
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const clientDir = fileURLToPath(new URL('../../client/', import.meta.url));
const serverDir = fileURLToPath(new URL('../../server/', import.meta.url));
const require = createRequire(new URL('../../server/package.json', import.meta.url));
const { MongoMemoryServer } = require('mongodb-memory-server');

for (const cwd of [clientDir, serverDir]) {
  const build = spawnSync('npm', ['run', 'build'], { cwd, stdio: 'inherit', shell: true });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const port = process.env.APP_PORT ?? '3399';
const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
const app = spawn(process.execPath, ['dist/main.js'], {
  cwd: serverDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port,
    MONGODB_URI: mongo.getUri('dialer-e2e'),
    JWT_SECRET: randomBytes(32).toString('hex'),
    CLIENT_ORIGIN: `http://localhost:${port}`,
  },
});

let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  app.kill();
  await mongo.stop();
  process.exit(code);
}
app.on('exit', (code) => void stop(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => void stop());
