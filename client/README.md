# Call Dialer: Client

The Angular frontend of the call dialer. For the full feature list, how free calling works and the backend, see the [project README](../README.md).

## Run it

The client needs the API running (see the [server README](../server/README.md)). Then:

```bash
npm install
npm start
```

Open **<http://localhost:4200>** and create an account. To see the phone-sized layout, turn on your browser's device toolbar (Ctrl+Shift+M in Chrome).

`ng serve` forwards `/api` and the calls socket (`/socket.io`) to the API, using [`proxy.conf.js`](proxy.conf.js). It expects the API on `http://localhost:3000`; if it's elsewhere, set `API_URL`:

```bash
# PowerShell
$env:API_URL = "http://localhost:3300"; npm start
# Git Bash / macOS / Linux
API_URL=http://localhost:3300 npm start
```

| Command | What it does |
| --- | --- |
| `npm start` | Dev server with live reload and the API proxy |
| `npm run build` | Production build into `dist/client/` |
| `npm test` | Unit tests with Karma (needs Chrome) |

On Windows, if the build crashes in Git Bash with `all goroutines are asleep - deadlock!`, use PowerShell or Command Prompt.

Calls use the microphone, which browsers only allow on `https` pages or `localhost`.

## Where things live

- **Pages**: `src/app/components/pages/`: login, register, account (My Card), keypad, contacts, contact detail, contact form, favorites, recents, call
- **API access**: `src/app/core/api/`: the `/api` base path, readable error messages, and the interceptor that sends the login token (and logs out when the server rejects it)
- **State**, kept in signals and loaded after login:
  - `src/app/core/services/auth/auth.service.ts`: the signed-in account (token kept in `localStorage` as `dialer.token`)
  - `src/app/core/services/contacts/contact.service.ts`: contacts, from `/api/contacts`
  - `src/app/core/services/calls/recents.service.ts`: call history, from `/api/calls`
  - `src/app/core/services/calls/call.service.ts`: the call in progress, as browser-to-browser audio (WebRTC) set up over the server's `/calls` socket
- **Helpers**: `src/app/core/utils/`: phone number formatting and validation, call times
