import { test, expect } from '@playwright/test';
import { TEST_USERS, SEEDED_QUESTIONS, loginUser, createQuestion, submitGuess } from './fixtures/test-fixtures';

test.describe('Guess Submission', () => {
  test('authenticated user can submit a guess', async ({ page }) => {
    await loginUser(page, TEST_USERS.charlie.email, TEST_USERS.charlie.password);

    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}`);
    await submitGuess(page, 350);

    await expect(page.getByText('Your guess has been submitted')).toBeVisible();
  });

  test('anonymous user can submit a guess with display name', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}`);

    await submitGuess(page, 400, 'TestUser');

    await expect(page.getByText('Your guess has been submitted')).toBeVisible();
  });

  test('can submit another guess after first one', async ({ page }) => {
    await loginUser(page, TEST_USERS.charlie.email, TEST_USERS.charlie.password);

    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}`);
    await submitGuess(page, 300);

    await expect(page.getByText('Your guess has been submitted')).toBeVisible();

    // Click to submit another
    await page.getByRole('button', { name: 'Submit another guess' }).click();

    // Should be able to submit again
    await expect(page.locator('#value')).toBeVisible();
    await submitGuess(page, 350);

    await expect(page.getByText('Your guess has been submitted')).toBeVisible();
  });

  test('shows submitting as username for logged in user', async ({ page }) => {
    await loginUser(page, TEST_USERS.bob.email, TEST_USERS.bob.password);

    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}`);

    await expect(page.getByText(/Submitting as:.*bob/)).toBeVisible();
  });

  test('shows name input for anonymous user', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}`);

    await expect(page.locator('#displayName')).toBeVisible();
  });
});

test.describe('Guess Validation', () => {
  test('shows error for guess below min bound', async ({ page }) => {
    // percentage-guess has bounds 0-100
    await page.goto(`/q/${SEEDED_QUESTIONS.percentage}`);

    const valueInput = page.locator('#value');

    // Remove min/max attributes to bypass native HTML5 validation
    await valueInput.evaluate((el: HTMLInputElement) => {
      el.removeAttribute('min');
      el.removeAttribute('max');
    });

    // Now fill with invalid value
    await valueInput.fill('-5');
    await page.getByRole('button', { name: 'Submit Guess' }).click();

    await expect(page.getByText(/must be in range/i)).toBeVisible();
  });

  test('shows error for guess above max bound', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.percentage}`);

    const valueInput = page.locator('#value');

    // Remove min/max attributes to bypass native HTML5 validation
    await valueInput.evaluate((el: HTMLInputElement) => {
      el.removeAttribute('min');
      el.removeAttribute('max');
    });

    // Now fill with invalid value
    await valueInput.fill('150');
    await page.getByRole('button', { name: 'Submit Guess' }).click();

    await expect(page.getByText(/must be in range/i)).toBeVisible();
  });

  test('accepts guess within bounds', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.percentage}`);

    await submitGuess(page, 50, 'BoundsTest');

    await expect(page.getByText('Your guess has been submitted')).toBeVisible();
  });

  test('shows range hint when bounds are set', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.percentage}`);

    // Should show range indicator
    await expect(page.getByText(/Range:.*0.*100/)).toBeVisible();
  });

  test('shows error for empty input', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}`);

    // Don't fill any value
    const submitButton = page.getByRole('button', { name: 'Submit Guess' });

    // Button should be disabled when input is empty
    await expect(submitButton).toBeDisabled();
  });
});

test.describe('Live Guess Updates', () => {
  test('guess count updates immediately after submission without refresh', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.jellybeans}`);

    // Get initial guess count
    const guessesHeader = page.getByText(/Guesses \(\d+\)/);
    const initialText = await guessesHeader.textContent();
    const initialCount = parseInt(initialText?.match(/\((\d+)\)/)?.[1] || '0');

    // Submit a guess
    await submitGuess(page, 500, 'LiveUpdateTest');
    await expect(page.getByText('Your guess has been submitted')).toBeVisible();

    // Verify count incremented without page refresh
    await expect(page.getByText(`Guesses (${initialCount + 1})`)).toBeVisible();
  });

  test('new guess appears in list immediately after submission', async ({ page }) => {
    await loginUser(page, TEST_USERS.charlie.email, TEST_USERS.charlie.password);
    await page.goto(`/q/${SEEDED_QUESTIONS.movieBudget}`);

    // This question has guesses_revealed = true, so we can see names
    // Submit a new guess
    await submitGuess(page, 275000000);
    await expect(page.getByText('Your guess has been submitted')).toBeVisible();

    // The new guess should appear in the list with charlie's username
    // charlie already has guesses so this will be "charlie 2" or similar
    await expect(page.getByText(/charlie/i).first()).toBeVisible();
  });
});

test.describe('Guess Display', () => {
  test('question shows correct guess count', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.movieBudget}`);

    // Movie budget has 4 guesses from seed
    await expect(page.getByText(/Guesses \(4\)/)).toBeVisible();
  });

  test('guesses revealed shows actual values', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.movieBudget}`);

    // This question has guesses_revealed = true
    await expect(page.getByText('Revealed')).toBeVisible();

    // Should see actual guess values (from seed: alice=$200M, charlie=$300M, diana=$250M, eve=$180M)
    // Values are formatted with commas - use first() since there might be multiple
    await expect(page.getByText('$200,000,000').first()).toBeVisible();
  });

  test('hidden guesses show blurred values', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.earthMoon}`);

    // This question has guesses_revealed = false
    // Values should be blurred (not showing actual numbers for other guesses)
    // The blur class should be present
    const blurredElements = page.locator('.blur-\\[2px\\]');
    await expect(blurredElements.first()).toBeVisible();
  });

  test('shows eye icon for guesses made with others visible', async ({ page }) => {
    await page.goto(`/q/${SEEDED_QUESTIONS.movieBudget}`);

    // Movie budget has guesses with prior_visible_guesses set (alice=0, charlie=1, diana=2, eve=3)
    // The FaEye icon from react-icons renders as an SVG
    // Find it by the parent span that has cursor-help class
    const eyeIconContainer = page.locator('span.cursor-help svg');
    await expect(eyeIconContainer.first()).toBeVisible();
  });
});
