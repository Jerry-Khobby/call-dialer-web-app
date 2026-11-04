import { test as base, expect, type BrowserContext, type Locator, type Page } from '@playwright/test';

export { expect };

export type User = {
  name: string;
  email: string;
  phone: string;
  password: string;
  page: Page;
  context: BrowserContext;
};

let created = 0;
/** Unique per run and per user, so tests never collide in the shared database. */
function uniqueId(): string {
  created++;
  return `${Date.now().toString().slice(-6)}${String(created % 100).padStart(2, '0')}`;
}

/**
 * Test-only instrumentation: remember every RTCPeerConnection the app creates, so a test
 * can read real audio statistics from a call. The app itself is unchanged.
 */
function recordPeerConnections() {
  const Original = window.RTCPeerConnection;
  const peers: RTCPeerConnection[] = [];
  (window as unknown as { __peers: RTCPeerConnection[] }).__peers = peers;
  const Recording = function (this: unknown, ...args: ConstructorParameters<typeof RTCPeerConnection>) {
    const peer = new Original(...args);
    peers.push(peer);
    return peer;
  } as unknown as typeof RTCPeerConnection;
  Recording.prototype = Original.prototype;
  window.RTCPeerConnection = Recording;
}

type Fixtures = {
  /** Signs up a new account in its own browser context; resolves once its calls socket is open. */
  makeUser: (name: string, options?: { microphone?: boolean }) => Promise<User>;
};

export const test = base.extend<Fixtures>({
  makeUser: async ({ browser, baseURL }, use) => {
    const contexts: BrowserContext[] = [];
    await use(async (name, { microphone = true } = {}) => {
      const context = await browser.newContext({
        baseURL,
        viewport: { width: 390, height: 844 },
        permissions: microphone ? ['microphone'] : [],
      });
      contexts.push(context);
      await context.addInitScript(recordPeerConnections);
      const page = await context.newPage();
      const id = uniqueId();
      const user: User = {
        name,
        email: `${name.split(' ')[0].toLowerCase()}.${id}@example.com`,
        phone: `05${id}`,
        password: 'password123',
        page,
        context,
      };

      await page.goto('/register');
      await page.getByLabel('Full name').fill(name);
      await page.getByLabel('Phone number').fill(user.phone);
      await page.getByLabel('Email').fill(user.email);
      await page.locator('#reg-password').fill(user.password);
      const socketOpen = page.waitForEvent('websocket', (ws) => ws.url().includes('/socket.io/'));
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page).toHaveURL(/\/keypad$/);
      await socketOpen;
      return user;
    });
    for (const context of contexts) await context.close();
  },
});

export async function logIn(page: Page, email: string, password = 'password123') {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

export async function logOut(page: Page) {
  await page.goto('/account');
  await page.getByRole('button', { name: 'Log Out' }).click();
  await expect(page).toHaveURL(/\/login/);
}

/** Types a number on the keypad and presses Call. */
export async function dial(page: Page, number: string) {
  // Loading the page reconnects the calls socket; wait for it, as a person would by
  // the time they've typed a number.
  const socketOpen = page.waitForEvent('websocket', (ws) => ws.url().includes('/socket.io/'));
  await page.goto('/keypad');
  await socketOpen;
  await page.locator('[data-keypad-key]').first().waitFor();
  await page.keyboard.type(number);
  await page.getByRole('button', { name: 'Call', exact: true }).click();
  await expect(page).toHaveURL(/\/call$/);
}

/** The call screen's status line (or, once connected, its timer badge). */
export function callStatus(page: Page): Locator {
  return page.locator('main p[aria-live]').last();
}

/** The running timer shown once the audio is connected. */
export function callTimer(page: Page): Locator {
  return page.locator('main p[aria-live]').filter({ hasText: /\d+:\d\d/ });
}

/** Rings `callee` from `caller`, answers, and waits until both see the call connected. */
export async function connectCall(caller: User, callee: User) {
  await dial(caller.page, callee.phone);
  await callee.page.getByRole('button', { name: 'Accept' }).click();
  await expect(callTimer(caller.page)).toBeVisible({ timeout: 20_000 });
  await expect(callTimer(callee.page)).toBeVisible({ timeout: 20_000 });
}

/** Calls the API as the signed-in user (to set up data quickly). */
export async function api(user: User, method: string, path: string, body?: unknown) {
  return user.page.evaluate(
    async ([method, path, body]) => {
      const token = JSON.parse(localStorage.getItem('dialer.token') ?? 'null') as string;
      const res = await fetch(`/api${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: res.status, body: res.status === 204 ? null : ((await res.json()) as unknown) };
    },
    [method, path, body] as const,
  );
}

/** Bytes of call audio this user's browser has received, from WebRTC's own statistics. */
export async function audioBytesReceived(user: User): Promise<number> {
  return user.page.evaluate(async () => {
    const peers = (window as unknown as { __peers: RTCPeerConnection[] }).__peers;
    const peer = peers.at(-1);
    if (!peer) return 0;
    let bytes = 0;
    (await peer.getStats()).forEach((stat: { type: string; kind?: string; bytesReceived?: number }) => {
      if (stat.type === 'inbound-rtp' && stat.kind === 'audio') bytes += stat.bytesReceived ?? 0;
    });
    return bytes;
  });
}

/** The visible rows of the Recents list, as text. */
export async function recentRows(page: Page): Promise<string[]> {
  const rows = await page.locator('main ul > li').allInnerTexts();
  return rows.map((row) => row.replace(/\s+/g, ' ').trim());
}
