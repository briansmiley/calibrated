import { test, expect } from '@playwright/test';
import { TEST_USERS, loginUser } from './fixtures/test-fixtures';

test.describe('User Profile', () => {
  test('logged in user can access profile page', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

    await page.goto('/profile');

    await expect(page.locator('[data-slot="card-title"]')).toContainText('Profile');
    await expect(page.locator('#email')).toHaveValue(TEST_USERS.alice.email);
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/login/);
  });

  test('user can set display name', async ({ page }) => {
    await loginUser(page, TEST_USERS.bob.email, TEST_USERS.bob.password);

    await page.goto('/profile');

    const displayNameInput = page.locator('#displayName');
    await displayNameInput.fill('BobbyTest');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Profile updated successfully')).toBeVisible();
  });

  test('user can clear display name', async ({ page }) => {
    await loginUser(page, TEST_USERS.charlie.email, TEST_USERS.charlie.password);

    await page.goto('/profile');

    const displayNameInput = page.locator('#displayName');
    await displayNameInput.clear();
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Profile updated successfully')).toBeVisible();
  });

  test('shows error for duplicate display name', async ({ page }) => {
    // First, set a unique display name for alice
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);
    await page.goto('/profile');
    await page.locator('#displayName').fill('UniqueAliceName');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Profile updated successfully')).toBeVisible();

    // Log out and log in as bob
    await page.goto('/');
    await loginUser(page, TEST_USERS.bob.email, TEST_USERS.bob.password);
    await page.goto('/profile');

    // Try to use the same display name
    await page.locator('#displayName').fill('UniqueAliceName');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText(/already taken/i)).toBeVisible();
  });

  test('header shows user avatar linking to profile', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

    // The avatar should be a circular link to /profile
    const avatar = page.locator('a[href="/profile"]');
    await expect(avatar).toBeVisible();
    // Avatar shows first letter of display name or email username
    await expect(avatar).toHaveClass(/rounded-full/);
  });

  test('clicking avatar navigates to profile', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

    const avatar = page.locator('a[href="/profile"]');
    await avatar.click();

    await expect(page).toHaveURL('/profile');
  });
});
