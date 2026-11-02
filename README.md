# Call Dialer Web App

A web dialer that works like the Phone app on a smartphone: type a number on a keypad and call it, keep contacts, mark favourites, and see your recent calls.

| Part | Stack | Status |
| --- | --- | --- |
| [`client/`](client/) | Angular 20, Tailwind CSS 4, Angular Material icons | Usable. Calls are simulated, and data is stored in the browser |
| [`server/`](server/) | NestJS 11, MongoDB (Mongoose) | Early. User, Contact and Call schemas exist; no API endpoints yet |

## Screenshots

| Keypad | Contacts | Contact detail |
| :---: | :---: | :---: |
| <img src="docs/screenshots/keypad.png" width="240" alt="Keypad with a typed number and the matching contact's name"> | <img src="docs/screenshots/contacts.png" width="240" alt="Contact list with A–Z sections and letter index"> | <img src="docs/screenshots/contact-detail.png" width="240" alt="Contact detail with message, call and favourite actions"> |
| **New contact** | **Recents** | **In a call** |
| <img src="docs/screenshots/new-contact.png" width="240" alt="New contact form"> | <img src="docs/screenshots/recents.png" width="240" alt="Recent calls with missed calls in red and grouped repeats"> | <img src="docs/screenshots/call.png" width="240" alt="Call screen with timer, mute, keypad and speaker"> |

## Features

**Keypad**
- Keys show their letters (2 ABC, 3 DEF…). Hold **0** to type **+**.
- Hold **backspace** to clear the whole number.
- Works with your computer keyboard too (see [Keyboard shortcuts](#keyboard-shortcuts)). Pasting a number also works.
- Numbers are formatted as you type (`024 123 4567`), and the contact's name appears when the number is saved.
- Pressing call with nothing typed fills in the last number you dialled.
- **Add Number** offers *Create New Contact* or *Add to Existing Contact*.

**Contacts**
- Alphabetical list with A–Z section headers and a letter index to jump through it.
- Search by name or phone number.
- Each contact has a detail page: call, message, add to favourites, and recent calls with that contact.
- Create, edit and delete contacts. First name and a valid phone number are required, and a number that's already saved is flagged.

**Favorites**: starred contacts. Tap a contact to call; tap ⓘ for details.

**Recents**
- Only back-to-back calls with the same number, type and day are grouped, e.g. "Daniel White (3)".
- Incoming, outgoing and missed calls each have their own icon.
- *All / Missed* filter, an ⓘ button that opens the contact (or creates one for an unknown number), and *Edit* mode to delete rows or clear everything.

**Call screen**
- Status moves from calling to ringing to a running timer to call ended.
- Mute, Speaker, and an in-call keypad for menu tones (e.g. "press 1 for…"). Add Call, Video and Contacts are shown but disabled until a voice provider supports them.
- If you leave the call screen during a call, a green **Return to call** banner takes you back.

## Keyboard shortcuts

On the keypad screen:

| Key | Action |
| --- | --- |
| `0`–`9`, `*`, `#`, `+` | Type the key |
| `Backspace` | Delete the last digit |
| `Escape` | Clear the number (or close the *Add Number* menu) |
| `Enter` | Call the number; with nothing typed, fill in the last number dialled |
| `Ctrl`+`V` | Paste a number (letters and other characters are dropped) |

With a mouse or touch screen: hold **0** for **+**, and hold **backspace** to clear everything.

## Current limitations

- **Calls are simulated.** A browser can't dial a phone number on its own. The call progress (ringing, connected) is produced by timers inside [`call.service.ts`](client/src/app/core/services/calls/call.service.ts). To make real calls, connect a voice provider such as the [Twilio Voice JavaScript SDK](https://www.twilio.com/docs/voice/sdks/javascript): start the provider's call in `dial()` and drive the call status from its events. Only that file needs to change.
- **Data lives in the browser.** Contacts and call history are saved in `localStorage` (keys `dialer.contacts` and `dialer.recents`) until the API exists. The first time you open the app it loads a few sample contacts and calls. To start empty, clear the site data in your browser's dev tools.
- **No sign-in yet.** The server has a `User` schema, but there is no login.

## Getting started

### Requirements

- **Node.js 20.19+ or 22.12+** (needed by Angular 20) and npm
- **MongoDB**, only if you want to run the server

### Run the frontend

```bash
cd client
npm install
npm start          # same as: npx ng serve
```

Open **<http://localhost:4200>**. The page reloads when you save a file. The layout is designed for phone width; to preview it that way, open your browser's dev tools and turn on the device toolbar (Ctrl+Shift+M in Chrome).

Other commands, run from `client/`:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build into `client/dist/client/` |
| `npm test` | Unit tests with Karma (needs Chrome) |

> **Windows note:** if `ng build` or `ng serve` crashes in Git Bash with `fatal error: all goroutines are asleep - deadlock!`, run it from PowerShell or Command Prompt instead.

### Run the backend

The server reads its settings from environment variables. Nothing loads a `.env` file yet (`@nestjs/config` is installed but not wired up), so set them in your shell:

| Variable | Required | Default |
| --- | --- | --- |
| `MONGODB_URI` | yes | none |
| `PORT` | no | `3000` |

```bash
cd server
npm install

# PowerShell
$env:MONGODB_URI = "mongodb://localhost:27017/call-dialer"
# Git Bash / macOS / Linux
export MONGODB_URI="mongodb://localhost:27017/call-dialer"

npm run start:dev
```

The server listens on **<http://localhost:3000>**.

## Project structure

```text
client/src/app/
├── components/
│   ├── atoms/        avatar, keypad button, icon button, search input, contact row,
│   │                 notification toast, long-press directive
│   ├── molecules/    contact list, in-call controls
│   ├── organisms/    keypad grid, tab bar
│   └── pages/        keypad, contacts, contact detail, contact form (new + edit),
│                     favorites, recents, call
├── core/
│   ├── services/
│   │   ├── contacts/     ContactService + Contact model (mirrors the server schema)
│   │   ├── calls/        CallService (the call in progress), RecentsService (call history),
│   │   │                 Call models, route guard for /call
│   │   └── notification/ toast messages
│   └── utils/        phone number formatting/validation, call times, localStorage helpers
└── app.routes.ts

server/src/
├── app.module.ts     MongoDB connection
└── modules/auth/schema/   User, Contact and Call schemas
```

Components follow an atomic-design layout, from small to large: atoms → molecules → organisms → pages. State is held in Angular signals inside the services, and the pages only read from them. That means swapping `localStorage` for HTTP calls to the server only changes the services.

### Routes

| Path | Page |
| --- | --- |
| `/keypad` | Keypad (home) |
| `/favorites` | Favourite contacts |
| `/recents` | Call history |
| `/contacts` | Contact list (`?addNumber=…` opens it in "pick a contact" mode) |
| `/contacts/new` | New contact (`?phone=…` fills in the number) |
| `/contacts/:id` | Contact detail |
| `/contacts/:id/edit` | Edit contact |
| `/call` | Call in progress. Without an active call, it redirects to `/keypad` |

## Roadmap

1. **REST API** for contacts and calls in the NestJS server, plus authentication.
2. **Switch the client services from `localStorage` to the API.**
3. **Real calling** through a voice provider (token endpoint on the server, voice SDK in the client), including incoming calls.
