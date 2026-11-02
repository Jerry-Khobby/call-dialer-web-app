# Call Dialer: Server

The NestJS backend of the call dialer. It's at an early stage: it connects to MongoDB and defines the data schemas, but it has **no API endpoints yet**, so the frontend stores its data in the browser for now. See the [project README](../README.md) for the full picture.

## Run it

You need a running MongoDB. The server reads its settings from environment variables. Nothing loads a `.env` file yet (`@nestjs/config` is installed but not wired up), so set them in your shell:

| Variable | Required | Default |
| --- | --- | --- |
| `MONGODB_URI` | yes | none |
| `PORT` | no | `3000` |

```bash
npm install

# PowerShell
$env:MONGODB_URI = "mongodb://localhost:27017/call-dialer"
# Git Bash / macOS / Linux
export MONGODB_URI="mongodb://localhost:27017/call-dialer"

npm run start:dev
```

The server listens on **<http://localhost:3000>**.

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Start with auto-restart on file changes |
| `npm run build` / `npm run start:prod` | Build into `dist/` and run the build |
| `npm test` | Unit tests (Jest) |
| `npm run test:e2e` | End-to-end tests |
| `npm run lint` | Lint and auto-fix |

## Data model

The schemas live in `src/modules/auth/schema/`. Every document also gets `createdAt` / `updatedAt` timestamps.

| Schema | Fields |
| --- | --- |
| **User** | `email` (unique, stored lowercase), `password`, `fullName` |
| **Contact** | `userId` → User, `firstName`, `lastName` (optional), `phoneNumber`. Indexed on `userId` and `phoneNumber` |
| **Call** | `userId` → User, `phoneNumber`, `contactName` (optional), `callType` (`outgoing` / `incoming` / `missed`), `duration` (seconds), `calledAt`. Indexed on `userId` + `calledAt` for "recent calls" queries |

The client's `Contact` and `CallRecord` types mirror these, so moving the client from `localStorage` to the API doesn't change the data's shape. The `favorite` flag is client-only for now; add it to the Contact schema when the API is built.

## Next steps

1. Load `.env` through `ConfigModule` from `@nestjs/config`.
2. Register the schemas and add authentication (sign-up / log-in).
3. Add contacts endpoints (list, create, update, delete) and call-history endpoints (list, add, delete), scoped to the signed-in user.
4. Add a token endpoint for the voice provider, so the client can place real calls.
