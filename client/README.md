# Call Dialer: Client

The Angular frontend of the call dialer. For the full feature list, current limitations and the backend, see the [project README](../README.md).

## Run it

```bash
npm install
npm start
```

Open **http://localhost:4200**. To see the phone-sized layout, turn on your browser's device toolbar (Ctrl+Shift+M in Chrome).

| Command | What it does |
|---|---|
| `npm start` | Dev server with live reload |
| `npm run build` | Production build into `dist/client/` |
| `npm test` | Unit tests with Karma (needs Chrome) |

On Windows, if the build crashes in Git Bash with `all goroutines are asleep - deadlock!`, use PowerShell or Command Prompt.

## Where things live

- **Pages**: `src/app/components/pages/` (keypad, contacts, contact detail, contact form, favorites, recents, call)
- **State**:
  - `src/app/core/services/contacts/contact.service.ts`: contacts
  - `src/app/core/services/calls/recents.service.ts`: call history
  - `src/app/core/services/calls/call.service.ts`: the call in progress
- **Helpers**: `src/app/core/utils/` (phone number formatting and validation, call times)

Contacts and call history are stored in `localStorage` (`dialer.contacts`, `dialer.recents`), and the app loads sample data the first time it runs. To start empty, clear the site data in your browser's dev tools.

Calls are simulated in `call.service.ts`. That is the only file to change when a real voice provider is added.
