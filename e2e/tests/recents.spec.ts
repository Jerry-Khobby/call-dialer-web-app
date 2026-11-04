import { api, expect, recentRows, test, type User } from './fixtures';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** A history like the server would have recorded after real calls. */
async function seedHistory(user: User) {
  await api(user, 'POST', '/contacts', { firstName: 'Daniel', lastName: 'White', phoneNumber: '0559993333' });
  const calls = [
    { phoneNumber: '0302111222', callType: 'outgoing', calledAt: minutesAgo(5 * 24 * 60) },
    { phoneNumber: '0559993333', callType: 'missed', calledAt: minutesAgo(24 * 60 + 3) },
    { phoneNumber: '0559993333', callType: 'missed', calledAt: minutesAgo(24 * 60) },
    { phoneNumber: '0249990000', callType: 'incoming', duration: 95, calledAt: minutesAgo(5), contactName: 'Yaa Asantewaa' },
  ];
  for (const call of calls) await api(user, 'POST', '/calls', call);
}

test.describe('Recents', () => {
  test('groups calls by day, names Dialer callers and collapses repeats', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    await seedHistory(ama);
    await ama.page.goto('/recents');

    await expect(ama.page.getByRole('region', { name: 'Today' })).toContainText('Yaa Asantewaa');
    await expect(ama.page.getByRole('region', { name: 'Today' })).toContainText('024 999 0000'); // caller ID + number
    await expect(ama.page.getByRole('region', { name: 'Yesterday' })).toContainText('Daniel White (2)');
    await expect(ama.page.getByRole('region', { name: 'Earlier' })).toContainText('030 211 1222');

    await ama.page.getByRole('tab', { name: 'Missed' }).click();
    expect(await recentRows(ama.page)).toEqual([expect.stringContaining('Daniel White (2)')]);
  });

  test('deleting a grouped row removes all its calls in one request', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    await seedHistory(ama);
    await ama.page.goto('/recents');
    await ama.page.getByRole('button', { name: 'Edit' }).click();

    const bulkDelete = ama.page.waitForResponse((r) => r.url().endsWith('/api/calls/bulk-delete'));
    await ama.page.getByRole('button', { name: 'Delete Daniel White from recents' }).click();
    const response = await bulkDelete;
    expect(await response.json()).toEqual({ deleted: 2 });

    await ama.page.reload();
    await expect(ama.page.getByText('Daniel White')).toHaveCount(0);
    await expect(ama.page.getByText('Yaa Asantewaa')).toBeVisible();
  });

  test('Clear All empties the history on the server', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    await seedHistory(ama);
    await ama.page.goto('/recents');
    await ama.page.getByRole('button', { name: 'Edit' }).click();
    await ama.page.getByRole('button', { name: 'Clear', exact: true }).click();
    await ama.page.getByRole('button', { name: 'Clear All Recents' }).click();
    await expect(ama.page.getByText('No Recents')).toBeVisible();

    await ama.page.reload();
    await expect(ama.page.getByText('No Recents')).toBeVisible();
    expect((await api(ama, 'GET', '/calls')).body).toEqual([]);
  });

  test('ⓘ on a Dialer caller who is not a contact pre-fills their name and number', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    await seedHistory(ama);
    await ama.page.goto('/recents');
    await ama.page.getByRole('button', { name: 'Details for Yaa Asantewaa' }).click();

    await expect(ama.page).toHaveURL(/\/contacts\/new/);
    await expect(ama.page.getByLabel('First name')).toHaveValue('Yaa');
    await expect(ama.page.getByLabel('Last name')).toHaveValue('Asantewaa');
    await expect(ama.page.getByLabel('Phone')).toHaveValue('0249990000');
  });

  test('Call with nothing typed fills in the last number dialled, even right after a reload', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    await seedHistory(ama);
    await ama.page.goto('/keypad');
    await ama.page.getByRole('button', { name: 'Call', exact: true }).click();
    await expect(ama.page.getByLabel('Number')).toHaveText('030 211 1222');
  });
});
