import { test, expect } from '@playwright/test';
import { TEST_USERS, SEEDED_QUESTIONS, loginUser } from './fixtures/test-fixtures';

test.describe('Results Page', () => {
  test('shows results for fully revealed question', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    await expect(page.getByText('Results')).toBeVisible();
    await expect(page.getByText('How many songs are on Spotify')).toBeVisible();
  });

  test('shows true answer when set', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    // Spotify question has true_answer = 100,000,000
    // The text is "True Answer: " followed by the value
    await expect(page.getByText(/True Answer:/)).toBeVisible();
    await expect(page.getByText('100,000,000').first()).toBeVisible();
  });

  test('shows all guesses sorted by value', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    // Should show rank numbers
    await expect(page.getByText('#1')).toBeVisible();
    await expect(page.getByText('#2')).toBeVisible();

    // Should show guesser names from seed data
    await expect(page.getByText('alice')).toBeVisible();
    await expect(page.getByText('bob')).toBeVisible();
  });

  test('highlights exact match guess', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    // diana guessed exactly 100,000,000 which matches the true answer
    // Her row should have green highlighting (border-green-500)
    // Find diana's name and verify the row has the highlighting
    await expect(page.getByText('diana')).toBeVisible();
    // The exact match row has border-2 border-green-500 class
    const highlightedRow = page.locator('.border-green-500');
    await expect(highlightedRow).toBeVisible();
  });

  test('non-revealed question redirects away from results', async ({ page }) => {
    // jellybeans is not revealed
    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}/results`);

    // Should redirect to the question page
    await expect(page).toHaveURL(`/q/${SEEDED_QUESTIONS.jellybeans}`);
  });

  test('creator sees admin link on results', async ({ page }) => {
    await loginUser(page, TEST_USERS.bob.email, TEST_USERS.bob.password);

    // Bob created spotify-songs
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    await expect(page.getByRole('link', { name: 'Back to Admin' })).toBeVisible();
  });

  test('non-creator does not see admin link', async ({ page }) => {
    await loginUser(page, TEST_USERS.alice.email, TEST_USERS.alice.password);

    // Bob created spotify-songs, not Alice
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    await expect(page.getByRole('link', { name: 'Back to Admin' })).not.toBeVisible();
  });
});

test.describe('Number Line Visualization', () => {
  test('renders number line on results page', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    // Number line container should exist
    const numberLine = page.locator('.h-16').first(); // The number line has h-16 class
    await expect(numberLine).toBeVisible();
  });

  test('shows guess dots on number line', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    // Guess dots have bg-zinc-500 class
    const guessDots = page.locator('.bg-zinc-500');
    await expect(guessDots.first()).toBeVisible();
  });

  test('shows true answer marker on number line', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    // True answer has green diamond (bg-green-500 and rotate-45)
    const answerMarker = page.locator('.bg-green-500.rotate-45');
    await expect(answerMarker).toBeVisible();
  });

  test('hover on guess dot shows value and name', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    // Find a guess dot and hover
    const guessDot = page.locator('.bg-zinc-500').first();
    await guessDot.hover();

    // Should expand to show value and show name tooltip
    // On hover, dots get bg-zinc-400 class and show value
    await expect(page.locator('.bg-zinc-400')).toBeVisible();
  });

  test('shows range labels at bottom', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.spotifySongs}/results`);

    // Range labels are at the bottom showing min and max values
    // The container div has classes: flex justify-between mt-1 text-xs text-muted-foreground
    // Looking for the formatted min/max values that appear on the number line
    // Based on seed data: guesses are 75M-120M, answer is 100M, so range should include those
    const rangeLabelContainer = page.locator('.flex.justify-between.text-xs');
    await expect(rangeLabelContainer).toBeVisible();
    // Should have 2 children (min and max labels)
    await expect(rangeLabelContainer.locator('span')).toHaveCount(2);
  });
});
