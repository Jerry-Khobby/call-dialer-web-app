import {
  audioBytesReceived,
  callStatus,
  callTimer,
  connectCall,
  dial,
  expect,
  recentRows,
  test,
} from './fixtures';

test.describe('Calls between Dialer users', () => {
  test('a full call carries audio both ways and is logged for both people', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    const kofi = await makeUser('Kofi Boateng');

    await dial(ama.page, kofi.phone);
    await expect(callStatus(ama.page)).toHaveText(/ringing…/);
    await expect(kofi.page.getByRole('heading', { name: 'Ama Owusu' })).toBeVisible(); // caller ID
    await expect(kofi.page.getByText('Dialer audio call')).toBeVisible();

    await kofi.page.getByRole('button', { name: 'Accept' }).click();
    await expect(callTimer(ama.page)).toBeVisible({ timeout: 20_000 });
    await expect(callTimer(kofi.page)).toBeVisible({ timeout: 20_000 });

    // Real audio, measured by WebRTC itself: a few kilobytes a second each way.
    await ama.page.waitForTimeout(3000);
    expect(await audioBytesReceived(ama)).toBeGreaterThan(2000);
    expect(await audioBytesReceived(kofi)).toBeGreaterThan(2000);

    await ama.page.getByRole('button', { name: 'End call' }).click();
    await expect(callStatus(kofi.page)).toHaveText('Call ended');

    // Recents update without a reload, on both sides.
    await expect(ama.page).toHaveURL(/\/keypad$/);
    await ama.page.getByRole('link', { name: 'Recents' }).click();
    await expect.poll(() => recentRows(ama.page)).toEqual([expect.stringMatching(/^Kofi Boateng /)]);
    await expect(kofi.page).toHaveURL(/\/keypad$/);
    await kofi.page.getByRole('link', { name: 'Recents' }).click();
    await expect.poll(() => recentRows(kofi.page)).toEqual([expect.stringMatching(/^Ama Owusu /)]);
  });

  test('mute and the in-call keypad', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    const kofi = await makeUser('Kofi Boateng');
    await connectCall(ama, kofi);

    const mute = ama.page.getByRole('button', { name: 'Mute' });
    await mute.click();
    await expect(ama.page.getByRole('button', { name: 'Muted' })).toHaveAttribute('aria-pressed', 'true');
    const micOn = () =>
      ama.page.evaluate(() => {
        const peer = (window as unknown as { __peers: RTCPeerConnection[] }).__peers.at(-1);
        return peer?.getSenders().find((s) => s.track?.kind === 'audio')?.track?.enabled;
      });
    expect(await micOn()).toBe(false);
    await ama.page.getByRole('button', { name: 'Muted' }).click();
    expect(await micOn()).toBe(true);

    await ama.page.getByRole('button', { name: 'Keypad' }).click();
    await ama.page.getByRole('button', { name: '1', exact: true }).click();
    await ama.page.getByRole('button', { name: '2 ABC' }).click();
    await expect(ama.page.getByText('12', { exact: true })).toBeVisible();
    await ama.page.getByRole('button', { name: 'End call' }).click();
  });

  test('declined, cancelled and unanswered calls', async ({ makeUser }) => {
    test.setTimeout(120_000); // includes the 30-second ring-out
    const ama = await makeUser('Ama Owusu');
    const kofi = await makeUser('Kofi Boateng');

    await dial(ama.page, kofi.phone);
    await kofi.page.getByRole('button', { name: 'Decline' }).click();
    await expect(callStatus(ama.page)).toHaveText('Declined');

    // Calling again straight away works, even while the other side still shows "Declined".
    await expect(ama.page).toHaveURL(/\/keypad$/);
    await dial(ama.page, kofi.phone);
    await expect(callStatus(ama.page)).toHaveText(/ringing…/);
    await ama.page.getByRole('button', { name: 'End call' }).click();
    await expect(callStatus(kofi.page)).toHaveText('Missed call');

    await expect(ama.page).toHaveURL(/\/keypad$/);
    await dial(ama.page, kofi.phone);
    await expect(callStatus(ama.page)).toHaveText('No answer', { timeout: 40_000 });
    await expect(callStatus(kofi.page)).toHaveText('Missed call');

    await kofi.page.goto('/recents');
    await kofi.page.getByRole('tab', { name: 'Missed' }).click();
    await expect.poll(() => recentRows(kofi.page)).toEqual([expect.stringMatching(/^Ama Owusu \(3\)/)]);
  });

  test('busy, offline, not on Dialer and your own number', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    const kofi = await makeUser('Kofi Boateng');
    const esi = await makeUser('Esi Asare');

    await dial(ama.page, kofi.phone);
    await expect(kofi.page.getByRole('button', { name: 'Accept' })).toBeVisible();
    await dial(esi.page, kofi.phone);
    await expect(callStatus(esi.page)).toHaveText('Busy');
    await ama.page.getByRole('button', { name: 'End call' }).click();

    await dial(esi.page, '0209999000');
    await expect(callStatus(esi.page)).toHaveText("This number isn't on Dialer.");
    await expect(esi.page.getByRole('button', { name: 'Call from your phone' })).toBeVisible();
    await esi.page.getByRole('button', { name: 'Cancel' }).click();

    await dial(esi.page, esi.phone);
    await expect(callStatus(esi.page)).toHaveText("You can't call your own number");

    await kofi.page.goto('/account');
    await kofi.page.getByRole('button', { name: 'Log Out' }).click();
    await dial(esi.page, kofi.phone);
    await expect(callStatus(esi.page)).toHaveText('Not available right now');
  });

  test('every open tab rings; answering in one stops the others', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    const kofi = await makeUser('Kofi Boateng');
    const secondTab = await kofi.context.newPage();
    const tabSocket = secondTab.waitForEvent('websocket');
    await secondTab.goto('/keypad');
    await tabSocket;

    await dial(ama.page, kofi.phone);
    await expect(kofi.page.getByRole('button', { name: 'Accept' })).toBeVisible();
    await expect(secondTab.getByRole('button', { name: 'Accept' })).toBeVisible();
    await kofi.page.getByRole('button', { name: 'Accept' }).click();
    await expect(secondTab).not.toHaveURL(/\/call$/);
    await expect(callTimer(ama.page)).toBeVisible({ timeout: 20_000 });
    await ama.page.getByRole('button', { name: 'End call' }).click();
  });

  test('leaving the call screen shows Return to call; logging out drops the call', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    const kofi = await makeUser('Kofi Boateng');
    await connectCall(ama, kofi);

    await kofi.page.goBack();
    await kofi.page.getByRole('link', { name: 'Return to call' }).click();
    await expect(callTimer(kofi.page)).toBeVisible();

    await kofi.page.goBack();
    await kofi.page.getByRole('link', { name: 'Contacts' }).click();
    await kofi.page.getByRole('link', { name: /Kofi Boateng.*My Card/ }).click();
    await kofi.page.getByRole('button', { name: 'Log Out' }).click();
    await expect(callStatus(ama.page)).toHaveText('Call dropped');
  });

  test('a blocked microphone gives a clear message', async ({ makeUser }) => {
    const kofi = await makeUser('Kofi Boateng');
    // What the browser does when the user clicks "Block" on the microphone prompt.
    await kofi.context.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
    });
    await dial(kofi.page, '0209999000'); // reloads the page, so the script above applies
    await expect(callStatus(kofi.page)).toHaveText('Allow microphone access to make calls.');
    await expect(kofi.page).toHaveURL(/\/keypad$/, { timeout: 5_000 }); // and the call screen closes
  });
});
