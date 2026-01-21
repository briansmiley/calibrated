import { test as base, expect, Page } from '@playwright/test';

/**
 * Test user credentials - must match users created by pnpm db:seed
 */
export const TEST_USERS = {
  alice: { email: 'alice@example.com', password: 'password123', name: 'alice' },
  bob: { email: 'bob@example.com', password: 'password123', name: 'bob' },
  charlie: { email: 'charlie@example.com', password: 'password123', name: 'charlie' },
} as const;

/**
 * Known question slugs from seed data
 */
export const SEEDED_QUESTIONS = {
  jellybeans: 'jellybeans-jar',           // Open, no guesses, public
  earthMoon: 'earth-moon-distance',       // Open, has guesses, public
  movieBudget: 'movie-budget',            // Guesses revealed, public
  spotifySongs: 'spotify-songs',          // Fully revealed, public
  percentage: 'percentage-guess',         // Has min/max bounds (0-100), public
  secret: 'secret-question',              // Password protected ('secret')
  privatePoll: 'private-poll',            // Private (not in feed)
  positiveNumber: 'positive-number',      // Has min bound only
} as const;

/**
 * Log in a user via the UI
 */
export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login?mode=signin');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
}

/**
 * Log out the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  // The sign out button has title="Sign Out" and contains an icon
  const logoutButton = page.locator('button[title="Sign Out"]');
  await logoutButton.click();
  await expect(page).toHaveURL('/');
}

/**
 * Create a question via the UI. Returns the slug.
 */
export async function createQuestion(
  page: Page,
  options: {
    title: string;
    description?: string;
    trueAnswer?: number;
    minValue?: number;
    maxValue?: number;
    isPublic?: boolean;
    password?: string;
  }
): Promise<string> {
  await page.goto('/new');

  await page.locator('#title').fill(options.title);

  if (options.description) {
    await page.locator('#description').fill(options.description);
  }

  if (options.trueAnswer !== undefined) {
    await page.locator('#trueAnswer').fill(options.trueAnswer.toString());
  }

  if (options.minValue !== undefined) {
    await page.locator('#minValue').fill(options.minValue.toString());
  }

  if (options.maxValue !== undefined) {
    await page.locator('#maxValue').fill(options.maxValue.toString());
  }

  if (options.isPublic) {
    await page.locator('#isPublic').check();
  }

  if (options.password) {
    await page.locator('#password').fill(options.password);
  }

  await page.getByRole('button', { name: 'Create Question' }).click();
  await expect(page).toHaveURL(/\/q\/[a-zA-Z0-9-]+\/admin/);

  const url = page.url();
  const slug = url.split('/q/')[1]?.split('/')[0] || '';
  return slug;
}

/**
 * Submit a guess on a question page
 */
export async function submitGuess(page: Page, value: number, displayName?: string): Promise<void> {
  if (displayName) {
    const nameInput = page.locator('#displayName');
    if (await nameInput.isVisible()) {
      await nameInput.fill(displayName);
    }
  }

  await page.locator('#value').fill(value.toString());
  await page.getByRole('button', { name: 'Submit Guess' }).click();
}

export const test = base;
export { expect };
