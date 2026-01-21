import { test, expect } from '@playwright/test';
import { TEST_USERS, loginUser, logoutUser } from './fixtures/test-fixtures';

test.describe('Email-first Auth Flow', () => {
  test('shows email entry form initially', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Sign in or create account')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('routes existing user to sign in flow', async ({ page }) => {
    await page.goto('/login');

    // Enter existing user's email
    await page.locator('#email').fill(TEST_USERS.alice.email);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Should show sign in form
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText(TEST_USERS.alice.email)).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText('Forgot password?')).toBeVisible();
  });

  test('routes new user to sign up flow', async ({ page }) => {
    await page.goto('/login');

    // Enter a new email that doesn't exist
    const newEmail = `newuser-${Date.now()}@example.com`;
    await page.locator('#email').fill(newEmail);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Should show sign up form
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.getByText(newEmail)).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('existing user can sign in successfully', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);
    await expect(page).toHaveURL('/dashboard');
  });

  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login');

    // Enter email and continue
    await page.locator('#email').fill(TEST_USERS.alice.email);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Enter wrong password
    await expect(page.getByText('Welcome back')).toBeVisible();
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show error
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test('can go back from sign in to email entry', async ({ page }) => {
    await page.goto('/login');

    // Enter email and continue
    await page.locator('#email').fill(TEST_USERS.alice.email);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Click back
    await expect(page.getByText('Welcome back')).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();

    // Should be back at email entry
    await expect(page.getByText('Sign in or create account')).toBeVisible();
  });

  test('can change email from sign in screen', async ({ page }) => {
    await page.goto('/login');

    // Enter email and continue
    await page.locator('#email').fill(TEST_USERS.alice.email);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Click "Change" link
    await expect(page.getByText('Welcome back')).toBeVisible();
    await page.getByRole('button', { name: 'Change' }).click();

    // Should be back at email entry
    await expect(page.getByText('Sign in or create account')).toBeVisible();
  });

  test('sign up validates password confirmation', async ({ page }) => {
    await page.goto('/login');

    // Enter new email
    const newEmail = `newuser-${Date.now()}@example.com`;
    await page.locator('#email').fill(newEmail);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Enter mismatched passwords
    await expect(page.getByText('Create your account')).toBeVisible();
    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('different456');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('forgot password flow is accessible', async ({ page }) => {
    await page.goto('/login');

    // Enter email and continue
    await page.locator('#email').fill(TEST_USERS.alice.email);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Click forgot password
    await expect(page.getByText('Welcome back')).toBeVisible();
    await page.getByText('Forgot password?').click();

    // Should show reset password form
    await expect(page.getByText('Reset your password')).toBeVisible();
    await expect(page.getByText(TEST_USERS.alice.email)).toBeVisible();
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
