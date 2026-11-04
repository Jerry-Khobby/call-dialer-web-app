import { INestApplication } from '@nestjs/common';
import express, { NextFunction, Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import type { ServerResponse } from 'node:http';

/**
 * Where the Angular production build lives. One deployed service serves both the API (/api)
 * and the app, so they share an origin: no CORS setup, and the calls socket just works.
 * CLIENT_DIST overrides it (the e2e tests point it at a small fixture).
 */
export function clientDistPath(): string {
  return resolve(
    process.env.CLIENT_DIST ??
      join(__dirname, '..', '..', '..', 'client', 'dist', 'client', 'browser'),
  );
}

// Angular puts a content hash in file names (main-ABCD1234.js), so those never change and
// can be cached for a year; everything else (index.html, icons) is checked on each visit.
const HASHED = /-[A-Z0-9]{8}\.(js|css)$/;

function cacheHeaders(res: ServerResponse, path: string): void {
  res.setHeader(
    'Cache-Control',
    HASHED.test(basename(path))
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  );
}

const isServerPath = (path: string) =>
  path.startsWith('/api/') || path === '/api' || path.startsWith('/socket.io/');

/**
 * Serves the app when a build is present (it isn't in local development, where `ng serve`
 * runs it). Other GET paths get index.html so app routes like /contacts/123 load; /api and
 * the calls socket are left to Nest and socket.io.
 */
export function serveClientApp(app: INestApplication): void {
  const root = clientDistPath();
  const index = join(root, 'index.html');
  if (!existsSync(index)) return;

  app.use(express.static(root, { index: false, setHeaders: cacheHeaders }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || isServerPath(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(index);
  });
}
