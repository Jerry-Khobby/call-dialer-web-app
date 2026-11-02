# Call Dialer: Server

The NestJS backend of the call dialer. It provides:

- **Accounts:** sign up with a phone number, log in, JWT tokens
- **Contacts** and **call history** REST APIs, private to each user
- **Free in-app calling:** a socket.io gateway that sets up browser-to-browser (WebRTC) calls between users, and records each call in both people's history

Everything it uses is free and open source. See the [project README](../README.md#how-calling-works-for-free) for why calls are app-to-app rather than to the phone network.

## Run it

```bash
npm install
cp .env.example .env   # then set JWT_SECRET to a long random string
npm run db             # terminal 1: local MongoDB on port 27017, nothing to install
npm run start:dev      # terminal 2: the API on http://localhost:3000/api
```

`npm run db` uses `mongodb-memory-server` to download the official MongoDB binary once and run it locally. Its data is kept in `server/.mongo-data/`, which is git-ignored. You can use your own MongoDB Community Server or a free MongoDB Atlas (M0) cluster instead; just set `MONGODB_URI`.

### Settings (`.env`)

The server checks these at startup and lists every missing or invalid one.

| Variable | Required | Default | |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | none | e.g. `mongodb://localhost:27017/call-dialer` |
| `JWT_SECRET` | yes | none | At least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | `7d` | How long a login lasts |
| `PORT` | no | `3000` | Change it if 3000 is already in use |
| `CLIENT_ORIGIN` | no | `http://localhost:4200` | Origins allowed to call the API (comma-separated) |
| `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` | no | none | Optional TURN relay, e.g. a self-hosted [coturn](https://github.com/coturn/coturn) |

### Commands

| Command | What it does |
| --- | --- |
| `npm run db` | Local development MongoDB |
| `npm run start:dev` | API with auto-restart on file changes |
| `npm run build` / `npm run start:prod` | Build into `dist/` and run the build |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests: the real app against an in-memory MongoDB, including socket.io call scenarios |
| `npm run lint` | Lint and auto-fix |

## REST API

All routes are under `/api`. Apart from register, login and health, every request needs the header `Authorization: Bearer <accessToken>`. Errors use Nest's standard shape, `{ statusCode, message, error }`; validation errors list each problem in `message`. Responses use `id` (not `_id`), and private fields such as password hashes are never returned.

### Auth

| Method and path | Body | Response |
| --- | --- | --- |
| `POST /auth/register` | `{ fullName, email, password, phoneNumber }` | `201 { accessToken, user }`. `409` if the email or number is already registered (numbers match regardless of spaces or dashes) |
| `POST /auth/login` | `{ email, password }` | `200 { accessToken, user }`, or `401` |
| `GET /auth/me` | | `200 user` |

Passwords must be 8–72 characters and are stored as bcrypt hashes. Register and login are limited to 20 requests per minute per IP address; other routes to 120.

### Contacts

| Method and path | Body | Response |
| --- | --- | --- |
| `GET /contacts` | | `200 Contact[]`, alphabetical |
| `POST /contacts` | `{ firstName, lastName?, phoneNumber, favorite? }` | `201 Contact`. `409 "This number is already saved as …"` |
| `PATCH /contacts/:id` | any of the fields above | `200 Contact` |
| `DELETE /contacts/:id` | | `204` |

`Contact = { id, firstName, lastName, phoneNumber, favorite, createdAt, updatedAt }`. This matches the client's `Contact` type.

### Call history

| Method and path | Body | Response |
| --- | --- | --- |
| `GET /calls?type=missed&limit=50` | | `200 Call[]`, newest first (`type` and `limit` are optional; `limit` is 1–500, default 100) |
| `POST /calls` | `{ phoneNumber, callType, duration?, calledAt?, contactName? }` | `201 Call`. For calls the server didn't see, e.g. ones handed to the phone app |
| `DELETE /calls/:id` | | `204` |
| `DELETE /calls` | | `204`, clears the whole history |
| `GET /calls/ice-servers` | | `200 RTCIceServer[]`: Google's free STUN servers, plus TURN if configured |

`Call = { id, phoneNumber, callType: 'outgoing' | 'incoming' | 'missed', duration (seconds), calledAt }`. This matches the client's `CallRecord` type.

### Health

`GET /health` returns `{ "status": "ok" }` and needs no token.

## Calling protocol (socket.io)

Connect to the `/calls` namespace with the same token: `io('http://localhost:3000/calls', { auth: { token } })`. A missing or invalid token is refused during the connection handshake (`connect_error: Unauthorized`). The server only relays call-setup messages; the audio flows directly between the two browsers.

| Direction | Event | Payload | Ack / notes |
| --- | --- | --- | --- |
| caller → server | `call:start` | `{ to: phoneNumber, offer }` | `{ ok: true, callId }`, or `{ ok: false, reason }` with `not-registered`, `self`, `offline`, `busy`, `in-call` or `invalid` |
| server → callee | `call:incoming` | `{ callId, from: { phoneNumber, fullName }, offer }` | Sent to every tab the callee has open |
| callee → server | `call:answer` | `{ callId, answer }` | The callee's other tabs get `call:ended` with reason `answered-elsewhere` |
| server → caller | `call:answered` | `{ callId, answer }` | |
| either → server → other | `call:ice` | `{ callId, candidate }` | Relayed to the other side |
| callee → server | `call:reject` | `{ callId }` | |
| either → server | `call:end` | `{ callId }` | Hang up, or cancel while it's still ringing |
| server → both | `call:ended` | `{ callId, reason }` | `reason`: `hangup`, `cancelled`, `rejected`, `no-answer` (after 30 s), `disconnected` or `answered-elsewhere` |

`offer`, `answer` and `candidate` are the browser's `RTCSessionDescription` and `RTCIceCandidate` objects, passed through unchanged.

Every call is saved to both histories before `call:ended` is sent, so a client can refresh Recents when it receives that event. A call the callee declines, doesn't answer, or can't receive (offline or busy) is recorded as **missed** for them.

## Project layout

```text
src/
├── main.ts, app.setup.ts   startup: /api prefix, helmet, compression, CORS, validation
├── config/env.validation.ts
├── common/                 phone-number rules (same as the client), MongoDB helpers
└── modules/
    ├── users/              User schema and lookups (by id, email, phone number)
    ├── auth/               register, login, JWT strategy, global guards, @Public()
    ├── contacts/           schema, DTOs, service, controller
    ├── calls/              schema, DTOs, service, controller, STUN/TURN list
    └── signaling/          socket.io gateway and its message types
test/                       e2e tests and helpers (in-memory MongoDB, socket.io client)
scripts/dev-db.mjs          `npm run db`
```
