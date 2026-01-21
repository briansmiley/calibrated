import { test, expect } from '@playwright/test';
import { TEST_USERS, SEEDED_QUESTIONS, loginUser, createQuestion } from './fixtures/test-fixtures';

test.describe('Question Creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);
  });

  test('can create a basic question', async ({ page }) => {
    const title = `Test Question ${Date.now()}`;
    const slug = await createQuestion(page, { title });

    expect(slug).toBeTruthy();
    await expect(page).toHaveURL(`/q/${slug}/admin`);
  });

  test('can create question with description and true answer', async ({ page }) => {
    const slug = await createQuestion(page, {
      title: `Detailed Question ${Date.now()}`,
      description: 'This is a test description',
      trueAnswer: 42,
    });

    await page.goto(`/q/${slug}`);
    await expect(page.getByText('This is a test description')).toBeVisible();
  });

  test('can create question with min/max bounds', async ({ page }) => {
    const slug = await createQuestion(page, {
      title: `Bounded Question ${Date.now()}`,
      minValue: 0,
      maxValue: 100,
    });

    await page.goto(`/q/${slug}`);
    // Should show range hint
    await expect(page.getByText(/0.*100|between/i)).toBeVisible();
  });

  test('can create public question', async ({ page }) => {
    const title = `Public Question ${Date.now()}`;
    const slug = await createQuestion(page, {
      title,
      isPublic: true,
    });

    // Check it appears in feed
    await page.goto('/feed');
    await expect(page.getByText(title)).toBeVisible();
  });

  test('requires title to create question', async ({ page }) => {
    await page.goto('/new');

    // Try to submit without title - button should be disabled
    const createButton = page.getByRole('button', { name: 'Create Question' });
    await expect(createButton).toBeDisabled();
  });
});

test.describe('Question Viewing', () => {
  test('can view seeded open question', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}`);

    await expect(page.getByText('How many jellybeans are in this jar?')).toBeVisible();
    await expect(page.getByText('Submit Your Guess')).toBeVisible();
  });

  test('anonymous users can view public questions', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.earthMoon}`);

    await expect(page.getByText('What is the distance from Earth to the Moon')).toBeVisible();
  });

  test('revealed question redirects to results page', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}`);

    // Fully revealed questions redirect to results
    await expect(page).toHaveURL(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);
  });

  test('shows guess count on question page', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.earthMoon}`);

    // Earth-moon question has 4 guesses from seed data
    await expect(page.getByText(/Guesses \(4\)/)).toBeVisible();
  });
});

test.describe('Question Admin', () => {
  test('creator can access admin page', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

    // Alice created jellybeans-jar
    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}/admin`);

    // Admin page shows "Share Link" section and question title
    await expect(page.getByText('Share Link')).toBeVisible();
    await expect(page.getByText('How many jellybeans')).toBeVisible();
  });

  test('non-creator cannot access admin page', async ({ page }) => {
    await loginUser(page, TEST_USERS.bob.email, TEST_USERS.bob.password);

    // Alice created jellybeans-jar, Bob shouldn't have admin access
    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}/admin`);

    // Should redirect or show unauthorized
    await expect(page).not.toHaveURL(`/q/${SEEDED_QUESTIONS.jellybeans}/admin`);
  });
});
