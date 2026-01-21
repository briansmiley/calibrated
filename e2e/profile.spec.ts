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

  test('header shows user avatar with dropdown menu', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

    // The avatar should be a circular button that opens a dropdown
    const avatarButton = page.locator('header button.rounded-full');
    await expect(avatarButton).toBeVisible();

    // Click to open dropdown and verify Profile link is there
    await avatarButton.click();
    await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeVisible();
  });

  test('clicking avatar menu navigates to profile', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

    // Open dropdown menu
    const avatarButton = page.locator('header button.rounded-full');
    await avatarButton.click();

    // Click Profile in the menu
    await page.getByRole('menuitem', { name: 'Profile' }).click();

    await expect(page).toHaveURL('/profile');
  });
});
