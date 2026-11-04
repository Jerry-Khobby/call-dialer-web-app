import { api, expect, test } from './fixtures';

test.describe('Contacts', () => {
  test('create, star, edit and delete are saved on the server', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    const page = ama.page;
    await page.goto('/contacts');
    await expect(page.getByText('No contacts yet')).toBeVisible();

    await page.getByRole('link', { name: 'New contact', exact: true }).click();
    await page.getByLabel('First name').fill('Yaa');
    await page.getByLabel('Last name').fill('Asantewaa');
    await page.getByLabel('Phone').fill('024 777 1111');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('heading', { name: 'Yaa Asantewaa' })).toBeVisible();
    const detailUrl = page.url();

    await page.getByRole('button', { name: 'Add Favorite' }).click();
    await expect(page.getByRole('button', { name: 'Favorite', exact: true })).toBeVisible();
    await page.reload(); // everything below comes back from the server
    await expect(page.getByRole('button', { name: 'Favorite', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await page.goto(`${detailUrl}/edit`); // opened directly, before the list has loaded
    await expect(page.getByLabel('First name')).toHaveValue('Yaa');
    await page.getByLabel('Last name').fill('Asantewaa II');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('heading', { name: 'Yaa Asantewaa II' })).toBeVisible();

    await page.getByRole('link', { name: 'Edit' }).click();
    await page.getByRole('button', { name: 'Delete Contact' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await page.reload();
    await expect(page.getByText('No contacts yet')).toBeVisible();
  });

  test('duplicate numbers are caught in the form and by the server', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    await api(ama, 'POST', '/contacts', { firstName: 'Abena', lastName: 'Mensah', phoneNumber: '0205559870' });

    // Already in the loaded list: the form warns before saving.
    await ama.page.goto('/contacts/new?phone=020%20555%209870');
    await expect(ama.page.getByText('Already saved as')).toBeVisible();
    await ama.page.getByLabel('First name').fill('Copy');
    await ama.page.getByRole('button', { name: 'Done' }).click();
    await expect(ama.page).toHaveURL(/\/contacts\/new/); // not saved
    expect(((await api(ama, 'GET', '/contacts')).body as unknown[]).length).toBe(1);

    // Saved meanwhile on another device: the server refuses and the message is shown.
    await ama.page.goto('/contacts/new?phone=0207770001');
    await ama.page.getByLabel('First name').fill('Late');
    await api(ama, 'POST', '/contacts', { firstName: 'Early', phoneNumber: '0207770001' });
    await ama.page.getByRole('button', { name: 'Done' }).click();
    await expect(ama.page.getByRole('status')).toHaveText(/already saved as Early/);
  });

  test('search finds by name or number; sections and My Card show', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    for (const [firstName, phoneNumber] of [['Kofi', '0244772611'], ['Chris', '0277778888'], ['Esi', '0501234567']]) {
      await api(ama, 'POST', '/contacts', { firstName, phoneNumber });
    }
    await ama.page.goto('/contacts');
    await expect(ama.page.getByRole('link', { name: /Ama Owusu.*My Card/ })).toBeVisible();
    await expect(ama.page.getByRole('region', { name: 'K' })).toContainText('Kofi');

    const search = ama.page.getByLabel('Search name or number');
    await search.fill('777');
    await expect(ama.page.locator('app-contact-item')).toHaveText([/Chris/]);
    await search.fill('esi');
    await expect(ama.page.locator('app-contact-item')).toHaveText([/Esi/]);
    await search.fill('zzz');
    await expect(ama.page.getByText('No results for "zzz"')).toBeVisible();
  });

  test('"Add to Existing Contact" from the keypad replaces the number', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    await api(ama, 'POST', '/contacts', { firstName: 'Daniel', lastName: 'White', phoneNumber: '0559993333' });
    await ama.page.goto('/keypad');
    await ama.page.locator('[data-keypad-key]').first().waitFor();
    await ama.page.keyboard.type('0209990002');
    await ama.page.getByRole('button', { name: 'Add Number' }).click();
    await ama.page.getByRole('button', { name: 'Add to Existing Contact' }).click();
    await ama.page.getByRole('button', { name: /Daniel White/ }).click();
    await expect(ama.page.getByLabel('Phone')).toHaveValue('0209990002');
    await ama.page.getByRole('button', { name: 'Done' }).click();
    await expect(ama.page.getByText('020 999 0002')).toBeVisible();
  });

  test("contacts are private to each account", async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    const kofi = await makeUser('Kofi Boateng');
    const created = await api(ama, 'POST', '/contacts', { firstName: 'Secret', phoneNumber: '0201234000' });
    const id = (created.body as { id: string }).id;

    await kofi.page.goto(`/contacts/${id}`);
    await expect(kofi.page.getByText('This contact no longer exists.')).toBeVisible();
    expect((await api(kofi, 'GET', `/contacts/${id}`)).status).toBe(404);
  });

  test('the keypad shows the saved name for a typed number, and calls start from Favorites', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    const kofi = await makeUser('Kofi Boateng');
    await api(ama, 'POST', '/contacts', { firstName: 'Kofi', lastName: 'Boateng', phoneNumber: kofi.phone, favorite: true });

    await ama.page.goto('/keypad');
    await ama.page.locator('[data-keypad-key]').first().waitFor();
    await ama.page.keyboard.type(kofi.phone);
    await expect(ama.page.getByRole('link', { name: /Kofi Boateng · mobile/ })).toBeVisible();

    await ama.page.goto('/favorites');
    await ama.page.getByRole('button', { name: 'Call Kofi Boateng' }).click();
    await expect(kofi.page.getByRole('button', { name: 'Accept' })).toBeVisible();
    await kofi.page.getByRole('button', { name: 'Decline' }).click();
  });
});
