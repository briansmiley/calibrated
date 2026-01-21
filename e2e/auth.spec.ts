import { test, expect } from '@playwright/test';
import { TEST_USERS, loginUser, logoutUser } from './fixtures/test-fixtures';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('shows login form with email and password fields', async ({ page }) => {
      await page.goto('/login?mode=signin');

      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    test('can log in with valid credentials', async ({ page }) => {
      await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

      await expect(page).toHaveURL('/dashboard');
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login?mode=signin');
      await page.locator('#email').fill('invalid@example.com');
      await page.locator('#password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Should show error message
      await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible();
      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('can toggle between sign in and sign up modes', async ({ page }) => {
      await page.goto('/login?mode=signin');

      await expect(page.getByText('Sign in to your account')).toBeVisible();

      await page.getByRole('button', { name: 'Sign up' }).click();
      await expect(page.getByText('Create an account')).toBeVisible();

      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByText('Sign in to your account')).toBeVisible();
    });
  });

  test.describe('Session', () => {
    test('maintains session after page refresh', async ({ page }) => {
      await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

      await page.reload();

      await expect(page).toHaveURL('/dashboard');
    });

    test('can log out successfully', async ({ page }) => {
      await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);
      await logoutUser(page);

      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Protected Routes', () => {
    test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects unauthenticated users from /new to /login', async ({ page }) => {
      await page.goto('/new');

      await expect(page).toHaveURL(/\/login/);
    });
  });
});
