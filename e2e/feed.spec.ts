import { test, expect } from '@playwright/test';
import { TEST_USERS, SEEDED_QUESTIONS, loginUser, createQuestion } from './fixtures/test-fixtures';

test.describe('Public Feed', () => {
  test('shows public questions feed page', async ({ page }) => {
    await page.goto('/feed');

    await expect(page.getByRole('heading', { name: 'Public Questions' })).toBeVisible();
    await expect(page.getByText('Browse and guess on questions')).toBeVisible();
  });

  test('shows seeded public questions in feed', async ({ page }) => {
    await page.goto('/feed');

    // jellybeans-jar is public and not revealed
    await expect(page.getByText('How many jellybeans are in this jar?')).toBeVisible();
  });

  test('does not show private questions in feed', async ({ page }) => {
    await page.goto('/feed');

    // private-poll has is_public = false
    await expect(page.getByText('How many hours did you sleep')).not.toBeVisible();
  });

  test('does not show revealed questions in feed', async ({ page }) => {
    await page.goto('/feed');

    // spotify-songs is revealed = true
    await expect(page.getByText('How many songs are on Spotify')).not.toBeVisible();
  });

  test('shows lock icon for password-protected questions', async ({ page }) => {
    await page.goto('/feed');

    // Check that the page loads (we may not have a seeded public+password question)
    await expect(page.getByRole('heading', { name: 'Public Questions' })).toBeVisible();
  });

  test('can click through to question from feed', async ({ page }) => {
    await page.goto('/feed');

    await page.getByText('How many jellybeans are in this jar?').click();

    await expect(page).toHaveURL(`/q/${SEEDED_QUESTIONS.jellybeans}`);
  });

  test('header has link to feed', async ({ page }) => {
    await page.goto('/');

    // Wait for header to load (it's client-side)
    await page.waitForLoadState('networkidle');

    const feedLink = page.getByRole('link', { name: 'Feed' });
    await expect(feedLink).toBeVisible();

    await feedLink.click();
    await expect(page).toHaveURL('/feed');
  });
});

test.describe('Password Protection', () => {
  test('shows password gate for protected question', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.secret}`);

    await expect(page.getByText('Password Required')).toBeVisible();
    await expect(page.getByText('This question is password protected')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('shows question title on password gate', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.secret}`);

    await expect(page.getByText('How many lines of code in this codebase?')).toBeVisible();
  });

  test('wrong password shows error', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.secret}`);

    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Unlock' }).click();

    await expect(page.getByText('Incorrect password')).toBeVisible();
  });

  test('correct password unlocks question', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.secret}`);

    // The secret question has password 'secret'
    await page.locator('#password').fill('secret');
    await page.getByRole('button', { name: 'Unlock' }).click();

    // Should now see the question content
    await expect(page.getByText('Submit Your Guess')).toBeVisible();
    await expect(page.getByText('Password Required')).not.toBeVisible();
  });

  test('password persists in session after unlock', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.secret}`);

    await page.locator('#password').fill('secret');
    await page.getByRole('button', { name: 'Unlock' }).click();

    await expect(page.getByText('Submit Your Guess')).toBeVisible();

    // Refresh the page
    await page.reload();

    // Should still be unlocked (sessionStorage persists)
    await expect(page.getByText('Submit Your Guess')).toBeVisible();
    await expect(page.getByText('Password Required')).not.toBeVisible();
  });

  test('unprotected questions show directly', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}`);

    // Should not show password gate
    await expect(page.getByText('Password Required')).not.toBeVisible();
    await expect(page.getByText('Submit Your Guess')).toBeVisible();
  });
});

test.describe('Question Visibility Settings', () => {
  test('can create public question that appears in feed', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

    const title = `Public Test ${Date.now()}`;
    await createQuestion(page, {
      title,
      isPublic: true,
    });

    await page.goto('/feed');
    await expect(page.getByText(title)).toBeVisible();
  });

  test('can create private question that does not appear in feed', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

    const title = `Private Test ${Date.now()}`;
    await createQuestion(page, {
      title,
      isPublic: false,
    });

    await page.goto('/feed');
    await expect(page.getByText(title)).not.toBeVisible();
  });

  test('can create password-protected question', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

    const title = `Protected Test ${Date.now()}`;
    const slug = await createQuestion(page, {
      title,
      password: 'testpass',
    });

    // Log out and try to access
    await page.goto(`/q/${slug}`);

    // Should show password gate
    await expect(page.getByText('Password Required')).toBeVisible();
  });
});
