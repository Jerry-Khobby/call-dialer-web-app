import { api, expect, logIn, logOut, test } from './fixtures';

test.describe('Accounts', () => {
  test('a signed-out visit goes to login, then back to the page wanted', async ({ page, makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    await logOut(ama.page);

    await page.goto('/recents');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Frecents$/);
    // Log in on the page the app redirected to (keeping its returnUrl).
    await page.getByLabel('Email').fill(ama.email);
    await page.locator('#login-password').fill(ama.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/recents$/);
  });

  test('sign-up checks every field before sending anything', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Email').fill('not-an-email');
    await page.locator('#reg-password').fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Enter your name.')).toBeVisible();
    await expect(page.getByText(/Enter 3–15 digits/)).toBeVisible();
    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Use 8 to 72 characters.')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('the eye button shows and hides the password', async ({ page }) => {
    await page.goto('/login');
    const password = page.locator('#login-password');
    await password.fill('my-secret');
    await expect(password).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
    await expect(password).toHaveValue('my-secret');
  });

  test('a wrong password and an already-used number show the server message', async ({ page, makeUser }) => {
    const kofi = await makeUser('Kofi Boateng');

    await logIn(page, kofi.email, 'wrong-password');
    await expect(page.getByRole('alert')).toHaveText(/Invalid email or password/);

    await page.goto('/register');
    await page.getByLabel('Full name').fill('Someone Else');
    await page.getByLabel('Phone number').fill(kofi.phone);
    await page.getByLabel('Email').fill(`other.${kofi.email}`);
    await page.locator('#reg-password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('alert')).toHaveText(/phone number already exists/);
  });

  test('a reload keeps you logged in; a rejected token logs you out', async ({ makeUser }) => {
    const esi = await makeUser('Esi Asare');
    await esi.page.goto('/contacts');
    await esi.page.reload();
    await expect(esi.page.getByText('My Card')).toBeVisible();

    await esi.page.evaluate(() => localStorage.setItem('dialer.token', JSON.stringify('forged-token')));
    await esi.page.reload();
    await expect(esi.page).toHaveURL(/\/login/);
    await expect(esi.page.getByRole('status')).toHaveText(/session has expired/);
  });

  test('Back after logging out does not show the app', async ({ makeUser }) => {
    const yaw = await makeUser('Yaw Mensah');
    await yaw.page.goto('/contacts');
    await logOut(yaw.page);
    await yaw.page.goBack();
    await expect(yaw.page).toHaveURL(/\/login/);
    expect(await yaw.page.evaluate(() => localStorage.getItem('dialer.token'))).toBe('null');
  });

  test("switching accounts in one tab shows only the new account's data", async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    const kofi = await makeUser('Kofi Boateng');
    await api(ama, 'POST', '/contacts', { firstName: 'OnlyAma', phoneNumber: '0201110001' });

    await logOut(ama.page);
    await logIn(ama.page, kofi.email); // Kofi now uses Ama's tab
    await ama.page.getByRole('link', { name: 'Contacts' }).click();
    await expect(ama.page.getByText('Kofi Boateng')).toBeVisible();
    await expect(ama.page.getByText('OnlyAma')).toHaveCount(0);
  });
});
